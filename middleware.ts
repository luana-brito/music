import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token }) => {
      return token?.role === 'ADMIN';
    },
  },
});

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/usuarios/:path*',
    '/api/musicas/upload',
    '/api/imagens/upload',
  ],
};
