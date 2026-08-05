'use client';

import React, { useState } from 'react';
import { Box, InputBase, IconButton, Stack, Chip, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilterYear?: (year: number | null) => void;
  onFilterTribo?: (triboId: string | null) => void;
  years?: number[];
  tribos?: Array<{ id: string; nome: string; cor: string }>;
}

export function Header({ onSearch, onFilterYear, onFilterTribo, years = [], tribos = [] }: HeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTribo, setSelectedTribo] = useState<string | null>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleYearFilter = (year: number) => {
    const newYear = selectedYear === year ? null : year;
    setSelectedYear(newYear);
    onFilterYear?.(newYear);
  };

  const handleTriboFilter = (triboId: string) => {
    const newTribo = selectedTribo === triboId ? null : triboId;
    setSelectedTribo(newTribo);
    onFilterTribo?.(newTribo);
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(25,118,210,0.1), rgba(0,0,0,0.3))',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Stack spacing={1}>
        {/* Logo and title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px' }}>🎵 Biblioteca</h2>
        </Box>

        {/* Search */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            paddingLeft: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <SearchIcon sx={{ color: '#999', fontSize: '20px' }} />
          <InputBase
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{
              flex: 1,
              padding: '8px 12px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '16px',
              '& ::placeholder': { color: '#999' },
            }}
          />
          {searchQuery && (
            <IconButton size="small" onClick={() => handleSearch('')}>
              <ClearIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          )}
        </Box>

        {/* Year filters */}
        {years.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {years.map((year) => (
              <Chip
                key={year}
                label={year.toString()}
                onClick={() => handleYearFilter(year)}
                variant={selectedYear === year ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: selectedYear === year ? '#1976d2' : 'transparent',
                  cursor: 'pointer',
                  minWidth: '60px',
                }}
              />
            ))}
          </Box>
        )}

        {/* Tribo filters */}
        {tribos.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {tribos.map((tribo) => (
              <Chip
                key={tribo.id}
                label={tribo.nome}
                onClick={() => handleTriboFilter(tribo.id)}
                variant={selectedTribo === tribo.id ? 'filled' : 'outlined'}
                sx={{
                  backgroundColor: selectedTribo === tribo.id ? tribo.cor : 'transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
