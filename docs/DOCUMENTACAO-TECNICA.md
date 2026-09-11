# Documentação técnica — Hype 1.0.0

PWA de músicas e paródias autorais. O catálogo e o player são públicos; o painel administrativo exige sessão de administrador.

| Item | Valor |
| --- | --- |
| Nome | Hype |
| Versão | `1.0.0` (`lib/appInfo.ts`) |
| Produção | https://music-umber-six.vercel.app |
| Repositório | `luana-brito/music` |
| Runtime | Next.js 15 (App Router), React 18, TypeScript |

---

## 1. Visão geral

O Hype é uma aplicação **monolítica** no App Router: páginas React no cliente, Route Handlers em `app/api/*` e PostgreSQL via Prisma.

Três camadas de persistência:

| Camada | Tecnologia | O que guarda |
| --- | --- | --- |
| Servidor | PostgreSQL (Prisma) | Usuários, tribos, músicas, contadores de play |
| Objetos | Vercel Blob (produção) ou `public/` (dev local) | Áudio e imagens |
| Cliente | IndexedDB + `localStorage` | Downloads offline e playlists do usuário |

O player vive em um React Context (`PlayerProvider`) montado no layout raiz, então a reprodução **não para** ao navegar entre Início, Biblioteca, Downloads e Playlists.

---

## 2. Stack

| Camada | Biblioteca | Uso |
| --- | --- | --- |
| Framework | Next.js `^15.2` | App Router, metadata, middleware, Route Handlers |
| UI | MUI 5 + Emotion | Tema escuro, layout, formulários admin |
| Estado remoto | TanStack Query + Axios | Cache e refetch de `/api/musicas` e `/api/tribos` |
| Formulários | React Hook Form + Zod | Validação no cliente e nas APIs |
| Auth | NextAuth 4 (Credentials + JWT) | Login admin, cookies, `getServerSession` |
| ORM | Prisma 5 | PostgreSQL |
| Storage | `@vercel/blob` | Upload direto e via token de cliente |
| PWA | `public/sw.js` + `manifest.json` | Cache, standalone, ícones |
| Offline | IndexedDB (`BibliotecaMusical`) | Blobs de áudio no dispositivo |

`next-pwa` está no `package.json`, mas o service worker **ativo** é o arquivo estático `public/sw.js`, registrado em `lib/providers.tsx`.

---

## 3. Arquitetura

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Browser    │────▶│  Next.js (Vercel)│────▶│  PostgreSQL │
│  PWA / SW   │     │  App Router      │     │  (Neon)     │
│  IndexedDB  │     │  middleware.ts   │     └─────────────┘
└─────────────┘     │  /api/*          │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Vercel Blob     │
                    │  musicas/        │
                    │  imagens/        │
                    └──────────────────┘
```

### 3.1 Providers (árvore de runtime)

Montados em `app/layout.tsx` via `lib/providers.tsx`:

1. `SessionProvider` (NextAuth) — sem refetch no foco
2. `QueryClientProvider` — retry 1, sem refetch no foco
3. `ThemeProvider` MUI (`lib/theme.ts`)
4. `SplashScreen` — 5 s na primeira visita da aba (`sessionStorage` `hype-splash-shown`)
5. `PlayerProvider` — áudio, Media Session, IndexedDB
6. `AppShell` — sidebar, conteúdo, player, bottom nav (oculto em `/login` e `/admin`)

### 3.2 Shell público vs admin

`components/layout/AppShell.tsx`:

- Rotas `/login` e `/admin/*` renderizam só o `children` (sem sidebar/player/bottom nav).
- Demais rotas usam `Sidebar` (≥ 1024 px), `Player` e `BottomNav` (< 1024 px).
- Offline: se a conexão cair fora de `/downloads`, `/login` e `/admin`, o shell redireciona para `/downloads`.

Breakpoints MUI customizados em `lib/theme.ts`: `sm = 640`, `md = 1024`. A sidebar some abaixo de `md`.

---

## 4. Estrutura de pastas

```
app/
  layout.tsx                 Layout raiz, metadata, fontes, PWA
  page.tsx                   Início (destaques / ranking)
  biblioteca/page.tsx        Catálogo completo
  downloads/page.tsx         Faixas salvas no dispositivo
  playlists/page.tsx         Listas locais
  playlists/[id]/page.tsx    Detalhe da playlist
  login/page.tsx             Credenciais admin
  settings/page.tsx          Ajustes do app (cache, downloads)
  admin/                     Painel (layout próprio)
    page.tsx                 Dashboard
    musicas/page.tsx
    tribos/page.tsx
    usuarios/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/      NextAuth
    musicas/                 CRUD + upload + play
    tribos/
    usuarios/
    imagens/upload/
components/
  layout/                    AppShell, Sidebar, Header, BottomNav, AdminLayout
  player/Player.tsx          UI do player
  brand/SplashScreen.tsx
  catalog/                   TrackList, filtros, playlists
  admin/                     Páginas admin compartilhadas
  ui/                        CoverArt, MusicaCard, uploads
hooks/
  usePlayer.tsx              Contexto de reprodução
  useApi.ts                  React Query + Axios
  useUserPlaylists.ts
  useCatalogFilters.ts
  useOnlineStatus.ts
lib/
  auth.ts                    NextAuth options + rate limit
  requireAdmin.ts            Guard de API
  prisma.ts                  Singleton Prisma
  blobUpload.ts              put/del Vercel Blob
  uploadLimits.ts            MIME, 20 MB, paths
  theme.ts / fonts.ts
  userPlaylists.ts           localStorage
  offlineDb.ts               IndexedDB
  appInfo.ts                 nome e versão
middleware.ts                Protege /admin e /api/usuarios
prisma/schema.prisma
public/
  sw.js                      Service worker
  manifest.json
  brand/hype-logo.png        Logo interna (transparente)
  icons/                     Favicon / PWA
  offline.html
```

Alias TypeScript: `@/*` → raiz do projeto (`tsconfig.json`).

---

## 5. Modelo de dados

PostgreSQL. IDs `cuid()`. Schema em `prisma/schema.prisma`.

### `Usuario`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | String | PK |
| `nome` | String | |
| `email` | String | único, normalizado em minúsculas |
| `senha` | String | hash bcrypt (custo 12 nas APIs, 10 no seed) |
| `role` | String | default `"ADMIN"` — único papel usado |

### `Tribo`

Grupo/categoria do catálogo (ex.: Front, Break, Set, Drop no seed).

| Campo | Tipo | Notas |
| --- | --- | --- |
| `nome` | String | |
| `cor` | String | hex na UI |
| `logo` | String? | URL Blob ou `/imagens/...` |

Não é possível excluir uma tribo que ainda tenha músicas (`409`).

### `Musica`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `nome`, `ano` | String, Int | ano ≥ 1900 |
| `blobUrl` | String | URL pública do áudio |
| `capa` | String? | se vazia, herda `tribo.logo` |
| `duracao` | Int | segundos |
| `plays` | Int | total |
| `playsWeek` | Int | plays da semana ISO |
| `playsWeekAt` | DateTime | início da semana do contador |
| `triboId` | String | FK `Tribo` |

`GET /api/musicas` zera `playsWeek` na resposta se `playsWeekAt` não for a semana ISO atual (`lib/week.ts`).

Seed (`prisma/seed.js` / `npm run seed`):

- Admin `admin@igreja.com` / `123456`
- Tribos Front, Break, Set, Drop

---

## 6. Rotas de página

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | Público | Home: ranking, filtros, play |
| `/biblioteca` | Público | Catálogo |
| `/downloads` | Público | Offline; destino automático sem rede |
| `/playlists` | Público | Playlists do `localStorage` |
| `/playlists/[id]` | Público | Edição/reprodução da lista |
| `/settings` | Público | Cache, downloads, versão |
| `/login` | Público | Só logo + formulário admin |
| `/admin` | ADMIN | Dashboard |
| `/admin/musicas` | ADMIN | CRUD de faixas + upload |
| `/admin/tribos` | ADMIN | CRUD de tribos |
| `/admin/usuarios` | ADMIN | CRUD de administradores |
| `/admin/settings` | ADMIN | Ajustes do painel |

Navegação desktop: `Sidebar` — Início, Downloads, Biblioteca, Playlists, **Administração** (`/admin` se logado, senão `/login`). A logo não é link.

Navegação mobile: `BottomNav` + ícone de admin no `Header`.

---

## 7. API REST

Base: `/api`. Cliente Axios em `hooks/useApi.ts` (`baseURL: '/api'`).

Validação Zod nas mutações. Respostas de erro típicas: `400` (payload), `401` (não admin), `404`, `409` (conflito de regra de negócio), `500`.

### 7.1 Autenticação

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth | Credentials JWT |

### 7.2 Músicas

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/musicas` | Público | Lista com `tribo`, `playsWeek` ajustado |
| POST | `/api/musicas` | Admin | Cria metadados (após upload) |
| PUT | `/api/musicas/[id]` | Admin | Atualiza; apaga blob antigo se a URL mudou |
| DELETE | `/api/musicas/[id]` | Admin | Remove registro + blobs (capa só se não for logo da tribo) |
| POST | `/api/musicas/[id]/play` | Público | Incrementa `plays` e `playsWeek` |
| POST | `/api/musicas/upload` | Admin | Áudio (ver §9) |

`GET` ordena por `plays` desc, depois `nome`.

Body de criação:

```json
{
  "nome": "string",
  "ano": 2024,
  "blobUrl": "https://... ou /musicas/arquivo.mp3",
  "capa": "https://... ou /imagens/arquivo.png | null",
  "duracao": 180,
  "triboId": "cuid"
}
```

### 7.3 Tribos

| Método | Rota | Auth |
| --- | --- | --- |
| GET | `/api/tribos` | Público |
| POST | `/api/tribos` | Admin |
| PUT | `/api/tribos/[id]` | Admin |
| DELETE | `/api/tribos/[id]` | Admin (409 se houver músicas) |

### 7.4 Usuários

Protegidos também pelo **middleware** (`/api/usuarios/:path*`).

| Método | Rota | Auth | Regras |
| --- | --- | --- | --- |
| GET | `/api/usuarios` | Admin | Sem campo `senha` |
| POST | `/api/usuarios` | Admin | Senha 8–120 chars; `role` sempre `ADMIN` |
| PUT | `/api/usuarios/[id]` | Admin | Senha opcional |
| DELETE | `/api/usuarios/[id]` | Admin | Não apaga a si mesmo nem o último admin |

### 7.5 Imagens

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/api/imagens/upload` | Admin | jpg, png, webp, gif; máx. 20 MB |

---

## 8. Autenticação e autorização

Arquivo: `lib/auth.ts`.

- Provider: **Credentials** (`email` + `senha`).
- Só usuários com `role === 'ADMIN'` autenticam.
- JWT, sessão de **8 h**, `updateAge` 30 min.
- Cookies seguros em produção (`useSecureCookies`).
- Rate limit em memória: **8 tentativas / 15 min** por e-mail (não persiste entre instâncias serverless).
- Hash: `bcrypt.compare` no login; `bcrypt.hash(..., 12)` nas APIs.

`middleware.ts` (`withAuth`):

- Matcher: `/admin`, `/admin/:path*`, `/api/usuarios/:path*`
- `authorized` só se `token.role === 'ADMIN'`
- Sem sessão → redirect `/login`

Demais APIs de escrita usam `requireAdmin()` (`getServerSession` + `401`).

Listagens de músicas/tribos e `POST .../play` **não** exigem login.

---

## 9. Upload e armazenamento

Limites em `lib/uploadLimits.ts`:

- Tamanho máximo: **20 MB**
- Áudio: `.mp3`, `.mpeg`, `.wav` (MIME correspondentes)
- Path Blob: `musicas/{timestamp}-{nome}.{mp3|wav}` e `imagens/{timestamp}-{nome}`

Duas formas no mesmo Route Handler (`application/json` vs multipart/body):

1. **Client upload (Vercel Blob)** — `handleUpload` gera token; o browser envia o arquivo direto ao Blob. Pathname deve começar com `musicas/` ou `imagens/`.
2. **Server upload** — FormData ou body bruto. Se existir `BLOB_READ_WRITE_TOKEN` / `BLOB_STORE_ID` ou `VERCEL`, usa `put()` público. Em **dev sem token**, grava em `public/musicas` ou `public/imagens` e devolve URL relativa.

Produção sem token Blob retorna `500`.

`uploadPublicBlob`: `access: 'public'`, overwrite, cache 1 ano.

`deletePublicBlob` só age em URLs `http(s):`; arquivos locais `/musicas/...` não são apagados do disco automaticamente.

---

## 10. Player

Implementação: `hooks/usePlayer.tsx` (lógica) + `components/player/Player.tsx` (UI).

### 10.1 Estado

```ts
currentTrack, playlist, shuffleQueue, isPlaying, volume,
repeatMode: 'none' | 'one' | 'all', isShuffle
```

API do contexto: `play`, `pause`, `resume`, `next`, `prev`, `seek`, `setVolume`, `toggleRepeat`, `toggleShuffle`, `downloadOffline`, `removeOffline`, `isOffline`, `getOfflineAudioUrl`.

### 10.2 Comportamento

- Um `<audio>` persistente no provider.
- Fonte: blob IndexedDB (object URL) se a faixa estiver offline; senão `musica.blobUrl`.
- **Shuffle**: fila de IDs (`lib/shuffle.ts`); ao acabar com repeat-all, reembaralha.
- **Anterior**: se `currentTime > 3 s`, reinicia a faixa; senão vai à anterior.
- **Fim da faixa**: `ended` + watchdog por `duration` (alguns browsers falham o evento `ended`). Repeat `one` usa `audio.loop`.
- **Media Session**: metadata, artwork (`lib/mediaArtwork.ts`), play/pause/seek, **anterior/próxima** (lock screen / fone).
- **Interrupção externa** (chamada, outro áudio):
  - `webkitbegininterruption` / `webkitendinterruption`
  - `navigator.audioSession` (`type = playback`, `statechange`)
  - pause inesperado: tenta `play()` de novo; se falhar, marca interrupção e não trata como pause do usuário
  - ao fim da interrupção, retoma se o usuário não pausou (`userPausedRef`)
- Preload da próxima faixa em um segundo elemento `Audio`.
- `playsinline` / AirPlay para iOS.

Contagem de plays: o cliente chama `POST /api/musicas/[id]/play` ao iniciar reprodução efetiva (não no admin).

UI: barra verde (`#10B981` / `#34E28A`), progresso, volume no desktop. Botões de exclusão no admin usam vermelho (`#EF4444`).

---

## 11. Offline e PWA

### 11.1 IndexedDB

- Banco: `BibliotecaMusical`
- Store: `musicas`, `keyPath: id`
- Registro: `{ id, blob: Blob, metadata: Musica }`
- Índice de IDs também em `localStorage.offlineMusicas`

Download: `fetch(blobUrl)` → `put` no store. Reprodução offline: `URL.createObjectURL(blob)`.

### 11.2 Service worker (`public/sw.js`)

Caches: `hype-v1.0.1` (precache) e `hype-runtime-v1.0.1`.

| Recurso | Estratégia |
| --- | --- |
| Precache | `/`, `/manifest.json`, `/offline.html` |
| Navegação | Network-first → cache → `offline.html` |
| `/api/*` e `/musicas/*` same-origin | Network-first com fallback de cache |
| Outros same-origin | Cache-first |
| `/_next/`, HMR, `/api/auth/` | Ignorado (passa na rede) |

`skipWaiting` + `clients.claim`. Caches antigos são apagados no `activate`.

Registro: `navigator.serviceWorker.register('/sw.js', { scope: '/' })`.

### 11.3 Manifest

`public/manifest.json`: `display: standalone`, `theme_color: #8B5CF6`, `background_color: #08090D`, ícones 192 / 512 / maskable 512.

Ícones de instalação (área de trabalho / favicon) vêm de `public/icons/` e `public/favicon.ico` / `favicon.png`. A **logo interna** (`public/brand/hype-logo.png`) é arte distinta, pintada de branco via CSS `filter: brightness(0) invert(1)`.

Metadata em `app/layout.tsx`: `themeColor #8B5CF6`, `apple-mobile-web-app-capable`, viewport `cover`, `maximumScale: 1`.

---

## 12. Playlists do usuário

Não vão para o banco. Persistência: `localStorage.userPlaylists` (`lib/userPlaylists.ts`).

```ts
{ id: string, nome: string, musicaIds: string[], createdAt: number }
```

Evento `userPlaylists-changed` sincroniza abas/componentes. IDs quebrados (música apagada no servidor) são ignorados na resolução contra o catálogo.

---

## 13. Identidade visual

Tokens em `app/globals.css` e `lib/theme.ts`.

| Token | Hex | Uso |
| --- | --- | --- |
| `--bg-base` | `#08090D` | Fundo |
| `--bg-elevated` | `#100A18` | Sidebar, cards elevados |
| `--surface` | `#14161D` | Área de conteúdo |
| `--brand-purple` | `#8B5CF6` | Primário, ativo, theme-color |
| `--brand-green` | `#10B981` | Play / progresso |
| `--brand-green-bright` | `#34E28A` | Destaque do player |
| `--danger` | `#EF4444` | Exclusão |

Fontes (`app/fonts.ts`) no `<body>`:

- Inter → `--font-sans`
- Anton → `--font-display` (títulos)
- JetBrains Mono → `--font-mono` (labels)

Splash: 5 s, tagline **NINGUEM QUER MAIS QUE A GENTE**, respeita `prefers-reduced-motion`.

Aliases `ORANGE*` em `theme.ts` apontam para o roxo (compatibilidade com código antigo).

---

## 14. Cliente de dados

`hooks/useApi.ts`:

- `useMusicas` / `useTribos`: refetch a cada 1 min se online, `staleTime` 20 s, `placeholderData` da query anterior.
- Mutations invalidam as query keys correspondentes.
- Upload de áudio/imagem: tenta client token Blob; senão POST multipart no servidor.

`useOnlineStatus` alimenta o AppShell e desliga o polling sem rede.

---

## 15. Segurança

Headers globais (`next.config.mjs`):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Outras medidas:

- `reactStrictMode` e `typedRoutes`
- Middleware + `requireAdmin` nas mutações
- Senhas nunca retornadas nas APIs
- Rate limit de login (por instância)
- Upload restrito a MIME/extensão e 20 MB
- Áudio público por URL (sem signed URL); qualquer um com o link reproduz

**Produção:** trocar a senha seed `123456` e usar `NEXTAUTH_SECRET` forte.

---

## 16. Variáveis de ambiente

Ver `.env.example`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | PostgreSQL (Neon em produção) |
| `NEXTAUTH_SECRET` | Sim | Segredo JWT |
| `NEXTAUTH_URL` | Sim | URL canônica (`http://localhost:3000` ou URL Vercel) |
| `BLOB_READ_WRITE_TOKEN` | Produção | Token read/write do Vercel Blob |
| `VERCEL_BLOB_TOKEN` | Legado | Aceito como fallback de nomenclatura antiga |
| `BLOB_STORE_ID` | Opcional | Store Blob |
| `VERCEL` | Automática | Força upload via Blob no deploy |

Local: copie `.env.example` → `.env.local`.

---

## 17. Scripts e operação

```bash
npm install
npx prisma db push
npx prisma generate
npm run seed          # admin + tribos
npm run dev           # http://localhost:3000
npm run build         # prisma generate && next build
npm start
```

Atalho: `npm run db:setup` = `prisma db push` + seed.

`postinstall` já executa `prisma generate` (necessário no Vercel).

### Credenciais de desenvolvimento

- E-mail: `admin@igreja.com`
- Senha: `123456`

Não usar em produção.

---

## 18. Deploy (Vercel)

1. PostgreSQL (Neon) com `DATABASE_URL`.
2. Store Vercel Blob + `BLOB_READ_WRITE_TOKEN`.
3. Env: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` = URL de produção.
4. Build: `prisma generate && next build` (script `build`).
5. Após o primeiro deploy: `prisma db push` (ou migrate) no banco de produção e seed se ainda não houver admin.

Projeto Vercel: `music`. Domínio atual: `music-umber-six.vercel.app`.

Não há `vercel.json`; a plataforma usa os defaults do Next.js.

Ao alterar o service worker, **incremente** `CACHE_NAME` / `RUNTIME_CACHE` em `public/sw.js` para os clientes descartarem cache antigo.

---

## 19. Fluxos principais

### Ouvir uma faixa

1. UI chama `play(playlist, index)`.
2. Provider carrega áudio (IndexedDB ou URL).
3. `MediaSession` atualiza metadados.
4. Cliente incrementa play no servidor.

### Publicar uma música (admin)

1. Login → `/admin/musicas`.
2. Upload áudio (e opcionalmente capa) → URL Blob.
3. `POST /api/musicas` com metadados e `triboId`.
4. Catálogo público passa a listar a faixa no próximo refetch.

### Instalar / usar offline

1. Manifest + SW permitem “Adicionar à tela inicial”.
2. Usuário baixa faixas → IndexedDB.
3. Sem rede, AppShell manda para `/downloads`; SW serve `offline.html` se a navegação falhar.

---

## 20. Limitações conhecidas

- Playlists e downloads são **por navegador**, sem conta de ouvinte.
- Rate limit de login não é compartilhado entre lambdas.
- IndexedDB ainda usa o nome legado `BibliotecaMusical`.
- Áudio no Blob é público.
- `next-pwa` não é o mecanismo de SW em uso.
- Pasta local de desenvolvimento pode não ser o git remote; o deploy segue o repositório `luana-brito/music`.

---

## 21. Referência rápida de arquivos críticos

| Tema | Arquivo |
| --- | --- |
| Versão / nome | `lib/appInfo.ts` |
| Auth | `lib/auth.ts`, `middleware.ts` |
| Schema | `prisma/schema.prisma` |
| Player | `hooks/usePlayer.tsx` |
| Tema | `lib/theme.ts`, `app/globals.css` |
| PWA | `public/sw.js`, `public/manifest.json` |
| Blob | `lib/blobUpload.ts`, `app/api/musicas/upload/route.ts` |
