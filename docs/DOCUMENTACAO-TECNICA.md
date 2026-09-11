# Documentação técnica — Hype 1.0.0

PWA de músicas e paródias autorais. O catálogo e o player são públicos; o painel administrativo exige sessão de administrador.

| Item | Valor |
| --- | --- |
| Nome | Hype |
| Versão | `1.0.0` (`lib/appInfo.ts`) |
| Produção | https://music-umber-six.vercel.app |
| Alias Vercel | https://music-luanabritos-projects.vercel.app |
| Repositório | https://github.com/luana-brito/music |
| Projeto Vercel | `music` (`prj_FHktI4sGJoYGg8Myxk54SVxoOPVj`) |
| Time Vercel | `luanabritos-projects` (plano Hobby) |
| Runtime | Next.js 15 (App Router), React 18, TypeScript |

Hospedagem detalhada: [HOSPEDAGEM.md](./HOSPEDAGEM.md).

---

## 1. Visão geral

Aplicação **monolítica** no App Router: páginas React no cliente, Route Handlers em `app/api/*` e PostgreSQL via Prisma.

| Camada | Tecnologia | O que guarda |
| --- | --- | --- |
| App / API | Next.js na Vercel | UI, autenticação, APIs |
| Banco | PostgreSQL (Neon) | Usuários, tribos, músicas, plays |
| Arquivos | Vercel Blob (prod) ou `public/` (dev) | Áudio e imagens |
| Cliente | IndexedDB + `localStorage` | Downloads offline e playlists |

O player (`PlayerProvider`) fica no layout raiz: a reprodução **não para** ao navegar entre Início, Biblioteca, Downloads e Playlists.

---

## 2. Stack

| Camada | Biblioteca | Uso |
| --- | --- | --- |
| Framework | Next.js `^15.2` | App Router, metadata, middleware, Route Handlers |
| UI | MUI 5 + Emotion | Tema escuro, layout, formulários admin |
| Estado remoto | TanStack Query + Axios | Cache de `/api/musicas` e `/api/tribos` |
| Formulários | React Hook Form + Zod | Validação no cliente e nas APIs |
| Auth | NextAuth 4 (Credentials + JWT) | Login admin |
| ORM | Prisma 5 | PostgreSQL |
| Storage | `@vercel/blob` | Upload de áudio/imagem |
| ZIP | `archiver` 8 (`ZipArchive`) | Exportação admin |
| PWA | `public/sw.js` + `manifest.json` | Cache e instalação |
| Offline | IndexedDB (`BibliotecaMusical`) | Áudio no dispositivo |

`next-pwa` está no `package.json`, mas o SW **em uso** é `public/sw.js` (registrado em `lib/providers.tsx`).

---

## 3. Arquitetura

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Browser     │────▶│  Vercel (Next.js)   │────▶│  Neon PG     │
│  PWA / SW    │     │  App Router         │     │  Prisma      │
│  IndexedDB   │     │  Serverless / Node  │     └──────────────┘
└──────────────┘     │  middleware.ts      │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  Vercel Blob        │
                     │  musicas/ imagens/  │
                     └─────────────────────┘
```

**Providers** (`lib/providers.tsx`): Session → React Query → MUI Theme → Splash (5 s) → Player → AppShell.

**Shell público:** sidebar (≥ 1024 px), player e bottom nav. `/login` e `/admin/*` usam layout próprio. Offline (fora de `/downloads`, `/login`, `/admin`) redireciona para `/downloads`.

---

## 4. Modelo de dados (PostgreSQL)

IDs `cuid()`. Schema: `prisma/schema.prisma`.

**Usuario** — `email` único, `senha` bcrypt, `role` sempre `ADMIN`.

**Tribo** — `nome`, `cor` (hex), `logo` opcional. Não exclui se ainda houver músicas (`409`).

**Musica** — `nome`, `ano`, `blobUrl`, `capa` (herda logo da tribo se vazia), `duracao`, `plays`, `playsWeek`, `playsWeekAt`, `triboId`.

Seed (`npm run seed`): admin `admin@igreja.com` / `123456` e tribos Front, Break, Set, Drop. **Trocar a senha em produção.**

---

## 5. Rotas de página

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Início / ranking |
| `/biblioteca` | Público | Catálogo |
| `/downloads` | Público | Offline |
| `/playlists`, `/playlists/[id]` | Público | Playlists no `localStorage` |
| `/settings` | Público | Cache e versão |
| `/login` | Público | Login admin |
| `/admin` | ADMIN | Dashboard |
| `/admin/musicas` | ADMIN | CRUD + upload |
| `/admin/tribos` | ADMIN | CRUD de tribos |
| `/admin/usuarios` | ADMIN | CRUD de admins |
| `/admin/exportar` | ADMIN | ZIP filtrado do catálogo |
| `/admin/settings` | ADMIN | Ajustes |

---

## 6. API REST (`/api`)

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth | Login JWT |
| GET | `/api/musicas` | Público | Lista + `playsWeek` |
| POST | `/api/musicas` | Admin | Cria metadados |
| PUT/DELETE | `/api/musicas/[id]` | Admin | Atualiza / apaga (+ blob) |
| POST | `/api/musicas/[id]/play` | Público | Incrementa plays |
| POST | `/api/musicas/upload` | Admin | Áudio (máx. 20 MB, mp3/wav) |
| GET | `/api/musicas/export` | Admin | ZIP (`?q=&ano=&triboId=`) |
| GET/POST | `/api/tribos` | GET público | Lista / cria |
| PUT/DELETE | `/api/tribos/[id]` | Admin | Atualiza / apaga |
| CRUD | `/api/usuarios` | Admin + middleware | Sem campo `senha` |
| POST | `/api/imagens/upload` | Admin | jpg/png/webp/gif, 20 MB |

ZIP: `app/api/musicas/export/route.ts` — Node runtime, `maxDuration` 60 s, `ZipArchive` (`store: true`). Pastas por tribo (`Tribo/Ano - Nome.mp3`). Falhas parciais geram `_erros.txt`.

---

## 7. Autenticação

- Credentials (e-mail + senha); só `ADMIN`.
- JWT 8 h; cookies seguros em produção.
- Rate limit em memória: 8 tentativas / 15 min por e-mail (não compartilhado entre lambdas).
- Middleware: `/admin`, `/admin/:path*`, `/api/usuarios/:path*`.
- Mutações de músicas/tribos/upload/export: `requireAdmin()`.

---

## 8. Player, PWA e identidade

**Player:** shuffle, repeat, Media Session (lock screen), interrupção externa (chamada/outro áudio) e retomada.

**SW** `hype-v1.0.2`: precache `/`, manifest e `offline.html`; navegação network-first; **não intercepta `/api/`** (o ZIP não passa pelo cache). `/_next/` na rede. Ao mudar o SW, incrementar o nome do cache.

**Tema:** preto `#08090D`, roxo `#8B5CF6`, verde `#10B981`, danger `#EF4444`. Fontes Anton / Inter / JetBrains Mono. Splash 5 s, tagline *NINGUEM QUER MAIS QUE A GENTE*.

Playlists: só `localStorage.userPlaylists` (por navegador).

---

## 9. Hospedagem (resumo)

| Serviço | Papel |
| --- | --- |
| **GitHub** `luana-brito/music` | Código-fonte, branch `main` |
| **Vercel** projeto `music` | App Next.js, SSL, CDN, serverless |
| **Neon** | PostgreSQL (`DATABASE_URL`) |
| **Vercel Blob** | Arquivos públicos de áudio/capa |

Push em `main` dispara deploy de **produção** automaticamente.

Variáveis no painel Vercel: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (URL canônica de produção), `BLOB_READ_WRITE_TOKEN`.

Detalhes, limites Hobby, DNS e operação: **[HOSPEDAGEM.md](./HOSPEDAGEM.md)**.

---

## 10. Scripts locais

```bash
npm install
npx prisma db push && npm run seed
npm run dev          # http://localhost:3000
npm run build        # prisma generate && next build
```

Admin de desenvolvimento: `admin@igreja.com` / `123456`.

---

## 11. Limitações

- Playlists e downloads offline são por dispositivo/navegador.
- Áudio no Blob é público (quem tem a URL reproduz).
- ZIP de muitas faixas pode estourar timeout (60 s) ou memória da função.
- Rate limit de login não é global.
- Plano Vercel Hobby: limites de duração e tamanho de resposta das functions.

---

## 12. Arquivos críticos

| Tema | Arquivo |
| --- | --- |
| Versão | `lib/appInfo.ts` |
| Auth | `lib/auth.ts`, `middleware.ts` |
| Schema | `prisma/schema.prisma` |
| Player | `hooks/usePlayer.tsx` |
| ZIP | `app/api/musicas/export/route.ts`, `lib/zipExport.ts` |
| Blob | `lib/blobUpload.ts` |
| PWA | `public/sw.js`, `public/manifest.json` |
| Tema | `lib/theme.ts`, `app/globals.css` |
