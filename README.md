# Hype

PWA de músicas e paródias autorais. Catálogo e player públicos; painel administrativo com login.

**Versão 1.0.0** · Produção: [music-umber-six.vercel.app](https://music-umber-six.vercel.app)

- Documentação técnica: [docs/DOCUMENTACAO-TECNICA.md](docs/DOCUMENTACAO-TECNICA.md)
- Hospedagem (Vercel, Neon, Blob): [docs/HOSPEDAGEM.md](docs/HOSPEDAGEM.md)

## Stack

Next.js 15 · TypeScript · MUI · Prisma / PostgreSQL · NextAuth · Vercel Blob · Service Worker + IndexedDB

## Início rápido

```bash
npm install
cp .env.example .env.local
npx prisma db push
npm run seed
npm run dev
```

http://localhost:3000 — admin de desenvolvimento: `admin@igreja.com` / `123456` (trocar em produção).

## Publicar

Push em `main` no GitHub (`luana-brito/music`) dispara deploy automático na Vercel (projeto `music`).
