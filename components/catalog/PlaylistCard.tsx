'use client';

import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { CoverArt } from '@/components/ui/CoverArt';
import { ELEVATED, MUTED } from '@/lib/theme';

interface PlaylistCardProps {
  name: string;
  color?: string | null;
  src?: string | null;
  count: number;
  selected?: boolean;
  fullWidth?: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

export function PlaylistCard({ name, color, src, count, selected, fullWidth, onSelect, onPlay }: PlaylistCardProps) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        minWidth: fullWidth ? 0 : 148,
        width: fullWidth ? '100%' : 148,
        cursor: 'pointer',
        '&:hover .play-fab': { opacity: 1, transform: 'translateY(0)' },
      }}
    >
      <Box sx={{ position: 'relative', mb: 1 }}>
        <CoverArt name={name} color={color} src={src} size={fullWidth ? '100%' : 148} rounded={8} />
        <IconButton
          className="play-fab"
          aria-label={`Tocar playlist ${name}`}
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            width: 44,
            height: 44,
            background: '#fff',
            color: '#000',
            opacity: 1,
            transform: 'none',
            transition: 'opacity 0.15s ease, transform 0.15s ease, background 0.15s ease',
            boxShadow: '0 8px 18px rgba(0,0,0,0.4)',
            '&:hover': { background: '#f2f2f2' },
          }}
        >
          <PlayArrowIcon />
        </IconButton>
      </Box>
      <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
        {name}
      </Typography>
      <Typography noWrap sx={{ color: selected ? '#fff' : MUTED, fontSize: 12 }}>
        {count} {count === 1 ? 'música' : 'músicas'}
      </Typography>
      {selected && (
        <Box sx={{ mt: 0.6, height: 3, borderRadius: 99, background: ELEVATED }}>
          <Box sx={{ width: '40%', height: '100%', borderRadius: 99, background: '#fff' }} />
        </Box>
      )}
    </Box>
  );
}
