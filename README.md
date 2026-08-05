# Biblioteca Musical

Aplicação web PWA para catalogar, reproduzir e baixar músicas da igreja. Desenvolvida com Next.js 15, TypeScript, Material UI e suporte completo para dispositivos móveis.

## 🎯 Recursos

### Público
- ✅ Reprodução de músicas
- ✅ Filtro por ano e tribo
- ✅ Pesquisa em tempo real
- ✅ Player persistente
- ✅ Download de músicas para offline
- ✅ PWA com instalação no celular

### Administrativo
- ✅ Dashboard com estatísticas
- ✅ Cadastro de tribos
- ✅ Gerenciamento de músicas
- ✅ Administração de usuários
- ✅ Autenticação segura com NextAuth
- ✅ Upload para Vercel Blob

## 🛠️ Stack Tecnológico

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Material UI** - Interface moderna
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de dados
- **React Query** - Gerenciamento de estado async
- **Axios** - Cliente HTTP
- **NextAuth** - Autenticação
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Vercel Blob** - Armazenamento de arquivos
- **IndexedDB** - Armazenamento offline

## 🚀 Início Rápido

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
VERCEL_BLOB_TOKEN=your_token
VERCEL_BLOB_REGION=ano
VERCEL_BLOB_NAME=your_bucket
```

### 3. Setup do Banco de Dados

```bash
# Executar migrations
npx prisma db push

# Gerar cliente Prisma
npx prisma generate

# Seed com dados iniciais
npm run seed
```

### 4. Executar Localmente

```bash
npm run dev
```

Acesse http://localhost:3000

**Credenciais de Teste:**
- Email: `admin@igreja.com`
- Senha: `123456`

## 📁 Estrutura do Projeto

```
app/
  ├── (public)
  │   ├── page.tsx              # Página inicial com lista de músicas
  │   ├── downloads/page.tsx    # Músicas offline
  │   └── settings/page.tsx     # Configurações do usuário
  ├── admin/
  │   ├── page.tsx              # Dashboard
  │   ├── tribos/page.tsx       # Gerenciar tribos
  │   ├── musicas/page.tsx      # Gerenciar músicas
  │   ├── usuarios/page.tsx     # Gerenciar admins
  │   └── settings/page.tsx     # Config admin
  ├── api/
  │   ├── auth/[...nextauth]/   # Autenticação
  │   ├── login/                # Login API
  │   ├── musicas/              # CRUD de músicas
  │   ├── tribos/               # CRUD de tribos
  │   └── usuarios/             # CRUD de usuários
  ├── layout.tsx                # Layout raiz
  └── globals.css               # Estilos globais
components/
  ├── layout/
  │   ├── Header.tsx            # Cabeçalho com filtros
  │   ├── BottomNav.tsx         # Navegação mobile
  │   └── AdminLayout.tsx       # Layout admin
  ├── player/
  │   └── Player.tsx            # Player fixo
  └── ui/
      └── MusicaCard.tsx        # Card de música
features/
  ├── music/                    # Domínio de músicas
  ├── tribo/                    # Domínio de tribos
  └── user/                     # Domínio de usuários
hooks/
  ├── usePlayer.tsx             # Contexto do Player
  └── useApi.ts                 # Hooks de API
lib/
  ├── prisma.ts                 # Cliente Prisma
  ├── providers.tsx             # Providers React
  └── ...                       # Utilitários
prisma/
  ├── schema.prisma             # Schema do banco
  └── seed.ts                   # Seed inicial
types/
  └── index.ts                  # Tipos TypeScript
middleware.ts                   # Middleware NextAuth
```

## 🔐 Autenticação

- Apenas **ADMIN** tem acesso ao painel administrativo
- Senhas são hashadas com bcryptjs
- Sessões seguras com NextAuth e JWT

## 📦 Deploy na Vercel

### 1. Preparar Banco de Dados

Use **Neon PostgreSQL** ou similar:
- Crie um projeto no Neon
- Copie a `DATABASE_URL`

### 2. Configurar Vercel Blob

- Crie um projeto no painel Vercel
- Gere um token de acesso
- Configure as variáveis de ambiente

### 3. Deploy

```bash
# Fazer push para GitHub
git push origin main

# Deploy automático via Vercel
# Ou manualmente em https://vercel.com
```

### 4. Variáveis de Ambiente no Vercel

Adicione no painel da Vercel:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (sua URL do Vercel)
- `VERCEL_BLOB_TOKEN`
- `VERCEL_BLOB_REGION`
- `VERCEL_BLOB_NAME`

## 🎨 Tema e Styling

- **Dark Mode** por padrão
- **Material UI** com customização
- **Mobile First** - otimizado para celulares
- **Responsivo** - adapta para tablets e desktops

## 🔍 Pesquisa e Filtros

- Pesquisa em tempo real por nome, tribo ou ano
- Filtro por ano (todos os anos catalogados)
- Filtro por tribo (multicolor)
- Filtros combinados

## 🎵 Player

- **Persistente** - continua durante navegação
- **Controles** - play, pause, próxima, anterior
- **Repeat** - none, one, all
- **Shuffle** - reprodução aleatória
- **Volume** - controle de volume
- **Progresso** - barra de progresso com seek

## ⬇️ Download Offline

- **IndexedDB** para armazenamento
- **Service Worker** para cache
- **Download automático** com progresso
- **Sincronização** ao restaurar internet

## ⚙️ Configurações

- Limpar cache
- Remover downloads
- Baixar apenas em Wi-Fi
- Informações da app

## 🚀 Performance

- **Lighthouse Score** > 90 em todas categorias
- **Code Splitting** automático
- **Image Optimization**
- **Lazy Loading** de listas
- **Streaming** do App Router
- **Cache inteligente** com React Query

## 📝 Notas de Desenvolvimento

### Adicionar Nova Música Manualmente

1. Fazer upload do arquivo MP3 para Vercel Blob
2. Copiar a URL gerada
3. No admin, clicar "Nova Música"
4. Preencher nome, ano, tribo e a URL do blob
5. Salvar

### Criar Novo Administrador

1. No admin, ir para "Usuários"
2. Clicar "Novo Usuário"
3. Preencher email e senha (mín 6 caracteres)
4. Salvar

### Adicionar Nova Tribo

1. No admin, ir para "Tribos"
2. Clicar "Nova Tribo"
3. Preencher nome e cor (hex)
4. Salvar

## 🐛 Troubleshooting

### "Could not connect to database"
- Verificar se a `DATABASE_URL` está correta
- Certificar que o banco está acessível
- Rodent `npx prisma db push`

### "Unauthorized" no admin
- Verificar se está logado
- Verificar se o usuário é ADMIN
- Limpar cookies e fazer login novamente

### Música não toca
- Verificar se a URL do Vercel Blob é válida
- Testar a URL diretamente no navegador
- Verificar se o arquivo é MP3 válido

## 📞 Suporte

Para bugs e sugestões, abra uma issue no repositório.

## 📄 Licença

Desenvolvido para Igreja. Todos os direitos reservados.
