'use client';

import React, { useState } from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: DashboardIcon, href: '/admin' },
    { label: 'Músicas', icon: MusicNoteIcon, href: '/admin/musicas' },
    { label: 'Tribos', icon: GroupIcon, href: '/admin/tribos' },
    { label: 'Usuários', icon: PersonIcon, href: '/admin/usuarios' },
    { label: 'Config', icon: SettingsIcon, href: '/admin/settings' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          🎵 Biblioteca
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.href}
            onClick={() => {
              router.push(item.href as never);
              setMobileOpen(false);
            }}
            selected={pathname === item.href}
            sx={{ backgroundColor: pathname === item.href ? 'rgba(25,118,210,0.2)' : 'transparent' }}
          >
            <ListItemIcon>
              <item.icon />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          sx={{ mt: 2, color: 'error.main' }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: 250, '& .MuiDrawer-paper': { width: 250 } }}>
          {drawer}
        </Drawer>
      )}

      {isMobile && (
        <>
          <AppBar position="fixed" sx={{ zIndex: 1201 }}>
            <Toolbar>
              <IconButton color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>
                Biblioteca Admin
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{ '& .MuiDrawer-paper': { width: 250 } }}
          >
            {drawer}
          </Drawer>
        </>
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isMobile && <Box sx={{ height: 64 }} />}
        {children}
      </Box>
    </Box>
  );
}
