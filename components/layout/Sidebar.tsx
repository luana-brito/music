'use client';

import React, { useEffect, useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useUserPlaylists } from '@/hooks/useUserPlaylists';
import { APP_DEVELOPER, APP_VERSION } from '@/lib/appInfo';
import { EASE, ELEVATED, MUTED, TEXT, NAV_ACTIVE } from '@/lib/theme';

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
          backgroundImage: 'radial-gradient(120% 80% at 0% 0%, rgba(139,92,246,0.16), transparent 62%)',
          borderRadius: 2.4,
          px: 1.5,
          py: 1.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src="/brand/hype-logo.png"
          alt="Hype"
          sx={{
            height: 52,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(139,92,246,0.25))',
            display: 'block',
            mx: 'auto',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
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
                  color: active ? TEXT : MUTED,
                  background: active ? NAV_ACTIVE : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(139,92,246,0.4)' : 'none',
                  '&:hover': { color: TEXT, background: active ? NAV_ACTIVE : 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? TEXT : MUTED }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: active ? 700 : 600, fontSize: 15 }}
                />
              </ListItemButton>
            );
          })}
          <ListItemButton
            component={Link}
            href={adminHref as never}
            sx={{
              mx: 1,
              my: 0.25,
              borderRadius: 1.5,
              color: MUTED,
              '&:hover': { color: TEXT, background: 'rgba(255,255,255,0.06)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: MUTED }}>
              {mounted && session?.user?.role === 'ADMIN' ? <AdminPanelSettingsIcon /> : <AdminPanelSettingsOutlinedIcon />}
            </ListItemIcon>
            <ListItemText
              primary="Administração"
              primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }}
            />
          </ListItemButton>
        </List>
      </Box>

      <Box sx={{ background: ELEVATED, borderRadius: 2.4, py: 1, flex: 1, overflow: 'auto' }}>
        <Typography sx={{ px: 2, py: 1, color: MUTED, fontFamily: 'var(--font-mono), monospace', fontSize: 11, fontWeight: 500, letterSpacing: '1.2px' }}>
          Suas playlists
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
                  color: active ? TEXT : MUTED,
                  background: active ? NAV_ACTIVE : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(139,92,246,0.4)' : 'none',
                  transition: `background 0.2s ${EASE}, color 0.2s ${EASE}`,
                  '&:hover': { color: TEXT, background: active ? NAV_ACTIVE : 'rgba(255,255,255,0.06)' },
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
          Desenvolvido pelo {APP_DEVELOPER} · v{APP_VERSION}
        </Typography>
      </Box>
    </Box>
  );
}
