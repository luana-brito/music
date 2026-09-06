'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SessionProvider } from 'next-auth/react';
import { PlayerProvider } from '@/hooks/usePlayer';
import { appTheme } from '@/lib/theme';
import { SplashScreen } from '@/components/brand/SplashScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.error('Falha ao registrar Service Worker:', error);
    });
  }, []);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <SplashScreen />
          <PlayerProvider>{children}</PlayerProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
