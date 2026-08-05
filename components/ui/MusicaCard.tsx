'use client';

import React from 'react';
import { Box, Card, CardContent, IconButton, Typography, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Musica } from '@/types';

interface MusicaCardProps {
  musica: Musica;
  onPlay: (musica: Musica) => void;
  isPlaying?: boolean;
}

export function MusicaCard({ musica, onPlay, isPlaying }: MusicaCardProps) {
  return (
    <Card
      sx={{
        background: isPlaying ? 'rgba(25,118,210,0.2)' : 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: isPlaying ? '2px solid #1976d2' : '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'rgba(25,118,210,0.15)',
          border: '1px solid rgba(25,118,210,0.5)',
        },
      }}
    >
      <CardContent sx={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Stack flex={1} spacing={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isPlaying ? '#1976d2' : '#fff' }} noWrap>
            {musica.nome}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#999' }}>
              {musica.tribo?.nome}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666' }}>
              •
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              {Math.floor(musica.duracao / 60)}:{(musica.duracao % 60).toString().padStart(2, '0')}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={() => onPlay(musica)} size="small" sx={{ color: isPlaying ? '#1976d2' : 'inherit' }}>
          <PlayArrowIcon />
        </IconButton>
      </CardContent>
    </Card>
  );
}
