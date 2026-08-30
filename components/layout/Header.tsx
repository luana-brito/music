'use client';

import React from 'react';
import { Box, IconButton, InputBase } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useSession } from 'next-auth/react';
import { MUTED } from '@/lib/theme';

interface HeaderProps {
  title?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function Header({ title, searchQuery = '', onSearch, searchPlaceholder = 'Buscar na biblioteca' }: HeaderProps) {
  const { data: session } = useSession();
  const adminHref = session?.user?.role === 'ADMIN' ? '/admin' : '/login';

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(18,18,18,0.92) 100%)',
        backdropFilter: 'blur(16px)',
        px: { xs: 2, md: 4 },
        pt: { xs: 1.5, md: 2 },
        pb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: onSearch || title ? 1.5 : 0 }}>
        <IconButton
          href={adminHref}
          component="a"
          aria-label={session?.user?.role === 'ADMIN' ? 'Abrir admin' : 'Entrar no admin'}
          sx={{
            color: '#fff',
            background: 'rgba(255,255,255,0.08)',
            width: 40,
            height: 40,
            '&:hover': { background: 'rgba(255,255,255,0.14)' },
          }}
        >
          <AdminPanelSettingsIcon />
        </IconButton>
        {title && (
          <Box
            sx={{
              fontWeight: 800,
              fontSize: { xs: 22, md: 28 },
              letterSpacing: '-0.03em',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Box>
        )}
      </Box>

      {onSearch && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999,
            px: 1.5,
            maxWidth: { xs: '100%', md: 420 },
            width: '100%',
            height: 44,
          }}
        >
          <SearchIcon sx={{ color: MUTED, fontSize: 22 }} />
          <InputBase
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            sx={{
              flex: 1,
              px: 1.2,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              '& ::placeholder': { color: MUTED, opacity: 1 },
            }}
          />
          {searchQuery && (
            <IconButton size="small" onClick={() => onSearch('')} aria-label="Limpar busca">
              <ClearIcon sx={{ fontSize: 18, color: MUTED }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  );
}
