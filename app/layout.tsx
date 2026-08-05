import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { Player } from '@/components/player/Player';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Biblioteca Musical',
  description: 'Biblioteca Musical da Igreja - músicas e paródias',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1976d2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Biblioteca Musical" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Player />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
