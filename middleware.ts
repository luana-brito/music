import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return token?.role === 'ADMIN';
    },
  },
});

export const config = {
  matcher: ['/admin/:path*', '/api/tribos/:path*', '/api/musicas/:path*', '/api/usuarios/:path*'],
};
