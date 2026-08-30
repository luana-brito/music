'use client';

import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import { usePathname, useRouter } from 'next/navigation';
import { BLACK, MUTED, ORANGE } from '@/lib/theme';
import { navValueFromPath } from '@/lib/nav';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
      }}
    >
      <BottomNavigation
        value={navValueFromPath(pathname)}
        showLabels
        onChange={(_, value) => {
          if (value === 'home') router.push('/' as never);
          if (value === 'downloads') router.push('/downloads' as never);
          if (value === 'biblioteca') router.push('/biblioteca' as never);
          if (value === 'playlists') router.push('/playlists' as never);
        }}
        sx={{
          background: BLACK,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          height: 64,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          '& .MuiBottomNavigationAction-root': {
            color: MUTED,
            minWidth: 0,
          },
          '& .Mui-selected': {
            color: `${ORANGE} !important`,
          },
        }}
      >
        <BottomNavigationAction label="Início" value="home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Downloads" value="downloads" icon={<CloudDownloadIcon />} />
        <BottomNavigationAction label="Biblioteca" value="biblioteca" icon={<LibraryMusicIcon />} />
        <BottomNavigationAction label="Playlists" value="playlists" icon={<QueueMusicIcon />} />
      </BottomNavigation>
    </Box>
  );
}
