'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserPlaylists } from '@/hooks/useUserPlaylists';
import { APP_DEVELOPER, APP_NAME, APP_VERSION } from '@/lib/appInfo';
import { EASE, ELEVATED, MUTED, ORANGE } from '@/lib/theme';

const navItems = [
  { label: 'Início', href: '/', icon: HomeOutlinedIcon, activeIcon: HomeIcon },
  { label: 'Downloads', href: '/downloads', icon: CloudDownloadOutlinedIcon, activeIcon: CloudDownloadIcon },
  { label: 'Biblioteca', href: '/biblioteca', icon: LibraryMusicOutlinedIcon, activeIcon: LibraryMusicIcon },
  { label: 'Playlists', href: '/playlists', icon: QueueMusicIcon, activeIcon: QueueMusicIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { playlists, ready } = useUserPlaylists();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const adminHref = mounted && session?.user?.role === 'ADMIN' ? '/admin' : '/login';

  return (
    <Box
      sx={{
        width: 260,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 1,
        height: '100%',
      }}
    >
      <Box
        sx={{
          background: ELEVATED,
          borderRadius: 2.4,
          px: 1.5,
          py: 1.6,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
        }}
      >
        <IconButton
          href={adminHref}
          component="a"
          aria-label="Admin"
          sx={{
            width: 42,
            height: 42,
            background: `linear-gradient(135deg, ${ORANGE}, #9a3a00)`,
            color: '#000',
            '&:hover': { background: ORANGE, transform: 'scale(1.04)' },
          }}
        >
          <AdminPanelSettingsIcon />
        </IconButton>
        <Box minWidth={0}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {APP_NAME}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 12 }}>v{APP_VERSION}</Typography>
        </Box>
      </Box>

      <Box sx={{ background: ELEVATED, borderRadius: 2.4, py: 1 }}>
        <List disablePadding>
          {navItems.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = active ? item.activeIcon : item.icon;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href as never}
                sx={{
                  mx: 1,
                  my: 0.25,
                  borderRadius: 1.5,
                  color: active ? '#fff' : MUTED,
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? ORANGE : 'inherit' }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 600, fontSize: 15 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box sx={{ background: ELEVATED, borderRadius: 2.4, py: 1, flex: 1, overflow: 'auto' }}>
        <Typography sx={{ px: 2, py: 1, color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 0.9 }}>
          SUAS PLAYLISTS
        </Typography>
        <List disablePadding>
          {ready && playlists.length === 0 && (
            <Typography sx={{ px: 2, color: MUTED, fontSize: 13 }}>Crie sua primeira playlist</Typography>
          )}
          {ready &&
            playlists.map((playlist) => {
            const href = `/playlists/${playlist.id}`;
            const active = pathname === href;
            return (
              <ListItemButton
                key={playlist.id}
                component={Link}
                href={href as never}
                sx={{
                  mx: 1,
                  borderRadius: 1.5,
                  color: active ? '#fff' : MUTED,
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: `background 0.2s ${EASE}, color 0.2s ${EASE}`,
                  '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemText
                  primary={playlist.nome}
                  secondary={`${playlist.musicaIds.length} músicas`}
                  primaryTypographyProps={{ noWrap: true, fontSize: 14, fontWeight: active ? 700 : 600 }}
                  secondaryTypographyProps={{ sx: { color: MUTED, fontSize: 12 } }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, color: MUTED, fontSize: 11 }}>
          Desenvolvido pelo {APP_DEVELOPER}
        </Typography>
      </Box>
    </Box>
  );
}
