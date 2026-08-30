'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { MusicaCard } from '@/components/ui/MusicaCard';
import { usePlayer } from '@/hooks/usePlayer';
import { MUTED } from '@/lib/theme';
import { Musica } from '@/types';

interface TrackListProps {
  musicas: Musica[];
  onPlay: (musica: Musica) => void;
  onAdd?: (musica: Musica) => void;
  onRemove?: (musica: Musica) => void;
}

export function TrackList({ musicas, onPlay, onAdd, onRemove }: TrackListProps) {
  const { state } = usePlayer();

  return (
    <>
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: '40px 1fr 160px 72px 56px 40px',
          gap: 1.5,
          px: 1.5,
          pb: 1,
          color: MUTED,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          mb: 0.8,
        }}
      >
        <Box>#</Box>
        <Box>TÍTULO</Box>
        <Box>TRIBO</Box>
        <Box sx={{ textAlign: 'right' }}>ANO</Box>
        <Box sx={{ textAlign: 'right' }}>
          <AccessTimeIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box />
      </Box>
      <Stack>
        {musicas.map((musica, index) => (
          <MusicaCard
            key={musica.id}
            musica={musica}
            index={index + 1}
            onPlay={onPlay}
            onAdd={onAdd}
            onRemove={onRemove}
            isPlaying={state.currentTrack?.musica.id === musica.id && state.isPlaying}
            isPaused={state.currentTrack?.musica.id === musica.id && !state.isPlaying}
          />
        ))}
      </Stack>
      {musicas.length === 0 && (
        <Typography sx={{ textAlign: 'center', color: MUTED, py: 6 }}>Nenhuma música encontrada</Typography>
      )}
    </>
  );
}
