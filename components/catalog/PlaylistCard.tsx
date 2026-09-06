'use client';

import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { CoverArt } from '@/components/ui/CoverArt';
import { EASE, MUTED, GREEN_BRIGHT, GREEN_HOVER } from '@/lib/theme';

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
        minWidth: fullWidth ? 0 : 168,
        width: fullWidth ? '100%' : 168,
        p: 1.2,
        borderRadius: 2.2,
        cursor: 'pointer',
        transition: `background 0.22s ${EASE}, transform 0.22s ${EASE}`,
        '&:hover': {
          background: 'rgba(255,255,255,0.06)',
        },
        '&:hover .play-fab': {
          opacity: 1,
          transform: 'translateY(0)',
        },
        '&:hover .cover-wrap': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        className="cover-wrap"
        sx={{
          position: 'relative',
          mb: 1.2,
          transition: `transform 0.25s ${EASE}`,
        }}
      >
        <CoverArt name={name} color={color} src={src} size={fullWidth ? '100%' : 148} rounded={12} />
        <IconButton
          className="play-fab"
          aria-label={`Tocar playlist ${name}`}
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 46,
            height: 46,
            background: GREEN_BRIGHT,
            color: '#000',
            opacity: { xs: 1, md: 0 },
            transform: { xs: 'none', md: 'translateY(8px)' },
            transition: `opacity 0.22s ${EASE}, transform 0.22s ${EASE}, background 0.2s ${EASE}`,
            boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
            '&:hover': { background: GREEN_HOVER, transform: 'scale(1.06)' },
          }}
        >
          <PlayArrowIcon />
        </IconButton>
      </Box>
      <Typography noWrap sx={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>
        {name}
      </Typography>
      <Typography noWrap sx={{ color: selected ? '#fff' : MUTED, fontSize: 12, mt: 0.2 }}>
        {count} {count === 1 ? 'música' : 'músicas'}
      </Typography>
    </Box>
  );
}
