'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Player } from '@/components/player/Player';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { BLACK, SURFACE } from '@/lib/theme';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const online = useOnlineStatus();
  const hideChrome = pathname.startsWith('/admin') || pathname.startsWith('/login');

  useEffect(() => {
    if (hideChrome || online || pathname === '/downloads') return;
    router.replace('/downloads' as never);
  }, [hideChrome, online, pathname, router]);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        height: { xs: '100dvh', md: '100vh' },
        background: BLACK,
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 0, md: 1 },
        gap: { xs: 0, md: 1 },
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: { xs: 0, md: 1 } }}>
        <Sidebar />
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            background: SURFACE,
            borderRadius: { xs: 0, md: 2.4 },
            overflow: 'auto',
            pb: { xs: 'calc(148px + env(safe-area-inset-bottom, 0px))', md: 0 },
          }}
        >
          {children}
        </Box>
      </Box>
      <Player />
      <BottomNav />
    </Box>
  );
}
