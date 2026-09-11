# Hospedagem — Hype

Como o Hype está publicado, o que cada serviço faz, variáveis, deploy e cuidados de operação.

## 1. Mapa da produção

```
Usuário ──HTTPS──▶  Vercel (CDN + Next.js)
                      │
                      ├── Neon PostgreSQL     metadados (usuários, tribos, músicas)
                      └── Vercel Blob         MP3/WAV e capas (URLs públicas)
```

| Recurso | Valor |
| --- | --- |
| URL principal | https://music-umber-six.vercel.app |
| Alias do time | https://music-luanabritos-projects.vercel.app |
| Código | https://github.com/luana-brito/music (`main`) |
| Projeto Vercel | `music` |
| Time | `luanabritos-projects` |
| Plano | **Hobby** |
| Framework | Next.js 15 (detectado automaticamente; sem `vercel.json`) |
| Build | `prisma generate && next build` (`npm run build`) |
| Região típica das functions | `iad1` (Virginia) |

Integração Git: cada **push em `main`** gera um deployment `target: production`. Preview de outras branches só existiria se fossem usadas; hoje o fluxo é direto em `main`.

---

## 2. Papel de cada provedor

### 2.1 Vercel (aplicação)

Hospeda o Next.js:

- **CDN** para HTML, JS, CSS, ícones e `public/`
- **Serverless / Node functions** para `app/api/*` e SSR
- **Edge middleware** (`middleware.ts`) nas rotas `/admin` e `/api/usuarios`
- **SSL** automático no `*.vercel.app`
- Registro do SW em `/sw.js` (arquivo estático)

O disco da function é **efêmero**. Em produção **não** se grava MP3 em `public/musicas`. Upload vai para o Blob.

### 2.2 Neon (banco)

PostgreSQL acessado por `DATABASE_URL` (Prisma).

Guarda:

- Administradores (`Usuario`)
- Tribos
- Catálogo (`Musica`: nome, ano, URL do arquivo, capa, duração, plays)

Não guarda o binário do áudio.

Após criar o banco: `npx prisma db push` (e `npm run seed` se ainda não houver admin). O `postinstall` só roda `prisma generate` (cliente), **não** aplica schema sozinho.

### 2.3 Vercel Blob (arquivos)

Store de objetos com URLs **públicas**.

| Prefixo | Conteúdo |
| --- | --- |
| `musicas/` | Áudio (mp3 / wav), até 20 MB |
| `imagens/` | Capas e logos de tribo |

Token: `BLOB_READ_WRITE_TOKEN`. Sem ele, o upload em produção retorna 500.

Áudio público: quem tiver o link reproduz, mesmo sem login. O login só protege o **cadastro** e o **ZIP**.

### 2.4 GitHub

Fonte da verdade do código. A Vercel clona o commit de `main` e faz o build. Não hospeda banco nem mídias.

---

## 3. Variáveis de ambiente

Configurar em **Vercel → Project → Settings → Environment Variables** (Production). Localmente: `.env.local` (não versionar).

| Variável | Obrigatória | Onde | Descrição |
| --- | --- | --- | --- |
| `DATABASE_URL` | Sim | Neon + Vercel | Connection string PostgreSQL |
| `NEXTAUTH_SECRET` | Sim | Vercel | Segredo JWT (aleatório longo) |
| `NEXTAUTH_URL` | Sim | Vercel | URL canônica, ex. `https://music-umber-six.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Produção | Vercel Blob | Leitura/escrita do store |
| `VERCEL_BLOB_TOKEN` | Legado | — | Nome antigo; preferir `BLOB_READ_WRITE_TOKEN` |
| `BLOB_STORE_ID` | Opcional | — | ID do store |
| `VERCEL` | Automática | Plataforma | Faz o upload usar Blob em vez de disco |

Local:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

Em dev, sem token Blob, os arquivos vão para `public/musicas` e `public/imagens`.

---

## 4. Como publicar uma alteração

1. Commit na pasta do projeto.
2. `git push origin main`.
3. A Vercel inicia o build (`prisma generate` + `next build`).
4. Se o build passar (`READY`), a URL de produção aponta para o novo deployment.
5. Se falhar (`ERROR`), a URL **continua no último deployment bom**.

Painel: https://vercel.com/luanabritos-projects/music

Ao mudar `public/sw.js`, o nome do cache (`hype-v1.0.2`) precisa subir de versão para os celulares trocarem o SW.

---

## 5. Domínio

Hoje: subdomínio `*.vercel.app` (SSL incluso).

Domínio próprio (ex. `hype.seudominio.com`):

1. Vercel → Project → Settings → Domains → Add.
2. No DNS do domínio, CNAME (ou A) conforme a Vercel indicar.
3. Atualizar `NEXTAUTH_URL` para `https://hype.seudominio.com`.
4. Redeploy (ou novo push) para o NextAuth aceitar o host.

---

## 6. Limites do plano Hobby (impacto no Hype)

Valores da Vercel Hobby mudam com o tempo; o que mais afeta este app:

| Limite | Efeito |
| --- | --- |
| Duração da function (~10–60 s) | ZIP de **muitas** faixas (`/api/musicas/export`, `maxDuration: 60`) pode estourar |
| Memória da function | ZIP monta os áudios em memória; lote grande pode 500 |
| Body de upload | Upload de faixa já limitado a **20 MB** na aplicação |
| Cold start | Primeiro hit após idle pode ser mais lento |
| Bandwidth / Blob | Tráfego de streaming e armazenamento de MP3 entram na cota |

Se o ZIP falhar com timeout, baixar por tribo/ano (filtros da tela) ou subir de plano.

---

## 7. Segurança na hospedagem

- HTTPS em todo o `*.vercel.app`.
- Headers: `X-Frame-Options: DENY`, `nosniff`, referrer strict, Permissions-Policy sem câmera/mic/geo (`next.config.mjs`).
- `/admin` e `/api/usuarios` exigem JWT ADMIN.
- Senhas com bcrypt; sessão 8 h.
- **Não** commitar `.env` / `.env.local`.
- Trocar o admin seed (`123456`) em produção.
- Arquivos no Blob são públicos: não colocar material confidencial lá.

---

## 8. Operação do dia a dia

| Tarefa | Onde |
| --- | --- |
| Subir músicas | Produção → `/admin/musicas` |
| Baixar catálogo em ZIP | `/admin/exportar` |
| Ver deploys / logs | Vercel → Deployments / Logs |
| Ver dados | Neon SQL ou `npx prisma studio` com a `DATABASE_URL` de prod (cuidado) |
| Rollback | Vercel → deployment anterior → Promote / Redeploy |

Logs úteis: falhas de `DATABASE_URL`, Blob sem token, 401 no admin, 500 no export ZIP.

---

## 9. Checklist de um ambiente novo

1. Repositório GitHub conectado à Vercel.
2. Projeto Neon + `DATABASE_URL` na Vercel.
3. `npx prisma db push` no banco de produção + seed (ou criar admin manualmente).
4. Store Blob + `BLOB_READ_WRITE_TOKEN`.
5. `NEXTAUTH_SECRET` e `NEXTAUTH_URL`.
6. Push em `main` até status **READY**.
7. Login em `/login` e teste de upload + play + ZIP.

---

## 10. O que a hospedagem **não** cobre

- Backup automático das mídias além do que o Blob retém (exportar ZIP periodicamente).
- Conta de ouvinte / sync de playlists entre aparelhos (só no browser).
- CDN própria para áudio: o streaming sai do Blob (origem pública).
