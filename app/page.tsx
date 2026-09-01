'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Header } from '@/components/layout/Header';
import { PlaylistCard } from '@/components/catalog/PlaylistCard';
import { CoverArt } from '@/components/ui/CoverArt';
import { InstallPwaCard } from '@/components/ui/InstallPwaCard';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { usePlayer } from '@/hooks/usePlayer';
import { musicasByTribo, sortMusicas, tribosWithYearMusicas } from '@/lib/catalog';
import { weekPlays } from '@/lib/week';
import { getCapaUrl } from '@/lib/capa';
import { EASE, MUTED, ORANGE, pageBg } from '@/lib/theme';
import { PlaylistItem } from '@/types';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { data: musicas, isLoading, error, isFetching } = useMusicas();
  const { data: tribos } = useTribos();
  const { play } = usePlayer();
  const [greeting, setGreeting] = useState('Olá');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite');
  }, []);

  const yearTribos = useMemo(() => {
    if (!musicas || !tribos) return [];
    const ids = tribosWithYearMusicas(musicas, tribos.map((tribo) => tribo.id), currentYear);
    return tribos.filter((tribo) => ids.includes(tribo.id));
  }, [musicas, tribos, currentYear]);

  const featured = useMemo(() => {
    if (!musicas?.length) return null;
    const weekly = [...musicas].sort(
      (a, b) => weekPlays(b) - weekPlays(a) || (b.plays || 0) - (a.plays || 0) || a.nome.localeCompare(b.nome, 'pt-BR')
    );
    const tracks = weekly.slice(0, 20);
    const top = tracks[0];
    return {
      title: 'Mais tocadas da semana',
      tracks,
      color: top?.tribo?.cor || ORANGE,
      cover: getCapaUrl(top),
    };
  }, [musicas]);

  const topPlayed = useMemo(() => {
    if (!musicas) return [];
    return sortMusicas(musicas, 'plays').slice(0, 10);
  }, [musicas]);

  const playList = (list: NonNullable<typeof musicas>, startId?: string) => {
    const playlist: PlaylistItem[] = list.map((musica) => ({ musica }));
    const startIndex = startId ? playlist.findIndex((item) => item.musica.id === startId) : 0;
    play(playlist, startIndex >= 0 ? startIndex : 0);
  };

  return (
    <Box sx={{ minHeight: '100%', background: pageBg() }}>
      <Header title={greeting} />

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 5 }}>
        <Box sx={{ mb: 2.5 }}>
          <InstallPwaCard compact />
        </Box>
        {isFetching && !isLoading && (
          <Typography sx={{ color: MUTED, fontSize: 12, mb: 1.5 }}>Atualizando catálogo…</Typography>
        )}

        {isLoading && !musicas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        ) : error ? (
          <Alert severity="error">Erro ao carregar músicas. Verifique a conexão.</Alert>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
                gap: 3,
                mb: 5,
                alignItems: 'stretch',
              }}
            >
              {featured && (
                <Box
                  onClick={() => playList(featured.tracks)}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: { xs: 220, md: 280 },
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${featured.color} 0%, #101010 78%)`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: { xs: 2.5, md: 4 },
                    transition: `transform 0.25s ${EASE}`,
                    '&:hover': { transform: 'translateY(-2px)' },
                    '&:hover .hero-play': { transform: 'scale(1.06)' },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      right: { xs: -24, md: 24 },
                      bottom: { xs: -20, md: 24 },
                      width: { xs: 160, md: 210 },
                      opacity: 0.95,
                      transform: 'rotate(8deg)',
                    }}
                  >
                    <CoverArt
                      name={featured.title}
                      color={featured.color}
                      src={featured.cover}
                      size="100%"
                      rounded={16}
                    />
                  </Box>
                  <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '68%' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: 700, letterSpacing: 1.4, mb: 1 }}>
                      PLAYLIST EM DESTAQUE
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 28, md: 42 }, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                      {featured.title}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.78)', mt: 1, mb: 2.2, fontSize: 14 }}>
                      {featured.tracks.length} {featured.tracks.length === 1 ? 'música' : 'músicas'} desta semana
                    </Typography>
                    <IconButton
                      className="hero-play"
                      aria-label={`Tocar ${featured.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        playList(featured.tracks);
                      }}
                      sx={{
                        width: 54,
                        height: 54,
                        background: ORANGE,
                        color: '#000',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                        transition: `transform 0.2s ${EASE}`,
                        '&:hover': { background: '#FF8533' },
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 30 }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 }, mb: 1.5, letterSpacing: '-0.03em' }}>
                  Em alta
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  {topPlayed.slice(0, 6).map((musica, index) => (
                    <Box
                      key={musica.id}
                      onClick={() => playList(topPlayed, musica.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1,
                        borderRadius: 1.6,
                        cursor: 'pointer',
                        transition: `background 0.18s ${EASE}`,
                        '&:hover': { background: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <Typography sx={{ width: 22, color: index < 3 ? ORANGE : MUTED, fontWeight: 800, fontSize: 14 }}>
                        {index + 1}
                      </Typography>
                      <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={46} rounded={8} />
                      <Box minWidth={0} flex={1}>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
                          {musica.nome}
                        </Typography>
                        <Typography noWrap sx={{ color: MUTED, fontSize: 12 }}>
                          {musica.plays || 0} plays • {musica.tribo?.nome}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 }, mb: 1.5, letterSpacing: '-0.03em' }}>
                Playlists de {currentYear}
              </Typography>
              {yearTribos.length === 0 ? (
                <Typography sx={{ color: MUTED }}>Nenhuma tribo com músicas em {currentYear}.</Typography>
              ) : (
                <Box
                  className="hide-scrollbar"
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    overflowX: 'auto',
                    pb: 1,
                    mx: { xs: -2, md: -1.2 },
                    px: { xs: 1, md: 0 },
                    scrollSnapType: 'x mandatory',
                    '& > *': { scrollSnapAlign: 'start' },
                  }}
                >
                  {yearTribos.map((tribo) => {
                    const tracks = musicasByTribo(musicas || [], tribo.id, currentYear);
                    return (
                      <PlaylistCard
                        key={tribo.id}
                        name={tribo.nome}
                        color={tribo.cor}
                        src={tribo.logo}
                        count={tracks.length}
                        onSelect={() =>
                          router.push(`/biblioteca?tribo=${tribo.id}&year=${currentYear}` as never)
                        }
                        onPlay={() => playList(tracks)}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
