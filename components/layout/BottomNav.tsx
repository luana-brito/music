'use client';

import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRouter, usePathname } from 'next/navigation';

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isMobile) return null;

  const currentValue = pathname === '/' ? 'home' : pathname.includes('downloads') ? 'downloads' : pathname.includes('settings') ? 'settings' : 'home';

  return (
    <BottomNavigation
      value={currentValue}
      onChange={(event, value) => {
        if (value === 'home') router.push('/');
        if (value === 'downloads') router.push('/downloads');
        if (value === 'settings') router.push('/settings');
      }}
      sx={{
        position: 'fixed',
        bottom: 280,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(25,118,210,0.1))',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <BottomNavigationAction label="Início" value="home" icon={<HomeIcon />} />
      <BottomNavigationAction label="Downloads" value="downloads" icon={<CloudDownloadIcon />} />
      <BottomNavigationAction label="Config" value="settings" icon={<SettingsIcon />} />
    </BottomNavigation>
  );
}
