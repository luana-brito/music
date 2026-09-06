'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BLACK, ELEVATED, MUTED, PURPLE, NAV_ACTIVE } from '@/lib/theme';

const DRAWER_WIDTH = 250;

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, href: '/admin' },
  { label: 'Músicas', icon: MusicNoteIcon, href: '/admin/musicas' },
  { label: 'Tribos', icon: GroupIcon, href: '/admin/tribos' },
  { label: 'Usuários', icon: PersonIcon, href: '/admin/usuarios' },
  { label: 'Config', icon: SettingsIcon, href: '/admin/settings' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', background: ELEVATED, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
        <Box
          component="img"
          src="/brand/hype-logo.png"
          alt="Hype"
          sx={{
            height: 36,
            width: 'auto',
            maxWidth: 150,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            display: 'block',
          }}
        />
      </Box>
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              onClick={() => {
                router.push(item.href as never);
                setMobileOpen(false);
              }}
              selected={active}
              sx={{
                mx: 1,
                borderRadius: 1.5,
                color: active ? '#fff' : MUTED,
                background: active ? NAV_ACTIVE : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(139,92,246,0.4)' : 'none',
                '&.Mui-selected': { background: NAV_ACTIVE },
                '&:hover': { background: active ? NAV_ACTIVE : 'rgba(255,255,255,0.06)', color: '#fff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: active ? PURPLE : 'inherit' }}>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 600 }} />
            </ListItemButton>
          );
        })}
        <ListItemButton
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          sx={{ mt: 2, mx: 1, borderRadius: 1.5, color: '#ef5350' }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', background: BLACK, width: '100%', overflowX: 'hidden' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              background: ELEVATED,
              borderRight: '1px solid rgba(255,255,255,0.06)',
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {isMobile && (
        <>
          <AppBar
            position="fixed"
            sx={{
              zIndex: 1201,
              background: BLACK,
              pt: 'env(safe-area-inset-top, 0px)',
            }}
          >
            <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
              <IconButton color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5 }} aria-label="Abrir menu">
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 800, fontSize: { xs: 16, sm: 20 } }} noWrap>
                Admin
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, background: ELEVATED } }}
          >
            {drawer}
          </Drawer>
        </>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          background: BLACK,
          pt: isMobile ? 'calc(56px + env(safe-area-inset-top, 0px))' : 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
