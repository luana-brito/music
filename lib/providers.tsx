'use client';

import React, { useEffect, useMemo } from 'react';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerProvider } from '@/hooks/usePlayer';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSw = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      } catch (error) {
        console.error('Falha ao registrar Service Worker:', error);
      }
    };

    registerSw();
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          background: {
            default: prefersDarkMode ? '#0d0d0d' : '#f5f5f5',
            paper: prefersDarkMode ? '#1e1e1e' : '#fff',
          },
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
        },
      }),
    [prefersDarkMode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <PlayerProvider>
          <CssBaseline />
          {children}
        </PlayerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
