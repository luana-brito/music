'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { PlaylistCard } from '@/components/catalog/PlaylistCard';
import { CoverArt } from '@/components/ui/CoverArt';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { usePlayer } from '@/hooks/usePlayer';
import { musicasByTribo, sortMusicas, tribosWithYearMusicas } from '@/lib/catalog';
import { getCapaUrl } from '@/lib/capa';
import { MUTED, ORANGE } from '@/lib/theme';
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
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(180deg, rgba(255,107,0,0.28) 0%, #121212 280px)' }}>
      <Header title={greeting} />

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
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
            <Box sx={{ mb: 5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 }, mb: 2 }}>
                Playlists de {currentYear}
              </Typography>
              {yearTribos.length === 0 ? (
                <Typography sx={{ color: MUTED }}>Nenhuma tribo com músicas em {currentYear}.</Typography>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    overflowX: 'auto',
                    pb: 1,
                    mx: { xs: -2, md: 0 },
                    px: { xs: 2, md: 0 },
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
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

            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, md: 24 }, mb: 2 }}>As 10 mais tocadas</Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 0.5,
                }}
              >
                {topPlayed.map((musica, index) => (
                  <Box
                    key={musica.id}
                    onClick={() => playList(topPlayed, musica.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { background: 'rgba(255,255,255,0.06)' },
                    }}
                  >
                    <Typography sx={{ width: 22, color: MUTED, fontWeight: 700 }}>{index + 1}</Typography>
                    <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={48} rounded={6} />
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
          </>
        )}
      </Box>
    </Box>
  );
}
