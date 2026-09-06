'use client';

import React from 'react';
import { Box, Card, IconButton, Typography, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CloseIcon from '@mui/icons-material/Close';
import { Musica } from '@/types';
import { CoverArt } from '@/components/ui/CoverArt';
import { EASE, HOVER, MUTED, GREEN, GREEN_BRIGHT, SURFACE } from '@/lib/theme';
import { getCapaUrl } from '@/lib/capa';
import { formatDuration } from '@/lib/format';

interface MusicaCardProps {
  musica: Musica;
  onPlay: (musica: Musica) => void;
  onAdd?: (musica: Musica) => void;
  onRemove?: (musica: Musica) => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  index?: number;
}

export function MusicaCard({ musica, onPlay, onAdd, onRemove, isPlaying, isPaused, index }: MusicaCardProps) {
  const active = Boolean(isPlaying || isPaused);

  return (
    <Card
      onClick={() => onPlay(musica)}
      sx={{
        background: active ? SURFACE : 'transparent',
        boxShadow: 'none',
        borderRadius: 1.6,
        borderLeft: active ? '3px solid var(--brand-green)' : '3px solid transparent',
        cursor: 'pointer',
        transition: `background 0.18s ${EASE}`,
        '&:hover': {
          background: HOVER,
          '& .play-on-hover': { opacity: 1 },
          '& .index-number': { opacity: 0 },
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '28px 1fr auto', md: '40px 1fr 160px 72px 56px 40px' },
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 0.85,
        }}
      >
        <Box sx={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {active && isPlaying ? (
            <Box sx={{ display: 'flex', gap: '2px', height: 14, alignItems: 'flex-end' }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 3,
                    bgcolor: GREEN,
                    animation: 'eq 0.8s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                    '@keyframes eq': {
                      '0%, 100%': { height: 4 },
                      '50%': { height: 14 },
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            <>
              <Typography className="index-number" sx={{ color: active ? GREEN : MUTED, fontSize: 14, fontWeight: 600 }}>
                {index ?? ''}
              </Typography>
              <PlayArrowIcon
                className="play-on-hover"
                sx={{
                  position: 'absolute',
                  fontSize: 22,
                  color: '#fff',
                  opacity: 0,
                  transition: `opacity 0.15s ${EASE}`,
                }}
              />
            </>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
          <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={40} rounded={6} />
          <Box minWidth={0}>
            <Typography noWrap sx={{ fontWeight: 600, fontSize: 15, color: active ? GREEN_BRIGHT : '#fff' }}>
              {musica.nome}
            </Typography>
            <Typography noWrap variant="caption" sx={{ color: MUTED, display: { xs: 'block', md: 'none' } }}>
              {musica.tribo?.nome}
            </Typography>
          </Box>
        </Stack>

        <Typography noWrap sx={{ color: MUTED, fontSize: 14, display: { xs: 'none', md: 'block' } }}>
          {musica.tribo?.nome}
        </Typography>

        <Typography sx={{ color: MUTED, fontSize: 14, display: { xs: 'none', md: 'block' }, textAlign: 'right', fontFamily: 'var(--font-mono), monospace' }}>
          {musica.ano}
        </Typography>

        <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'right', fontFamily: 'var(--font-mono), monospace', fontVariantNumeric: 'tabular-nums' }}>
          {formatDuration(musica.duracao)}
        </Typography>
        <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {onAdd && (
            <IconButton size="small" aria-label="Adicionar à playlist" onClick={() => onAdd(musica)} sx={{ color: MUTED }}>
              <PlaylistAddIcon fontSize="small" />
            </IconButton>
          )}
          {onRemove && (
            <IconButton size="small" aria-label="Remover" onClick={() => onRemove(musica)} sx={{ color: MUTED }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Card>
  );
}
