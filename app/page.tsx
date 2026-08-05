'use client';

import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { MusicaCard } from '@/components/ui/MusicaCard';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { usePlayer } from '@/hooks/usePlayer';
import { PlaylistItem } from '@/types';

export default function HomePage() {
  const { data: musicas, isLoading: musicasLoading, error: musicasError } = useMusicas();
  const { data: tribos } = useTribos();
  const { state, play } = usePlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTribo, setSelectedTribo] = useState<string | null>(null);

  const filteredMusicas = useMemo(() => {
    if (!musicas) return [];

    return musicas.filter((m) => {
      const matchSearch = m.nome.toLowerCase().includes(searchQuery.toLowerCase()) || m.tribo?.nome.toLowerCase().includes(searchQuery.toLowerCase()) || m.ano.toString().includes(searchQuery);
      const matchYear = !selectedYear || m.ano === selectedYear;
      const matchTribo = !selectedTribo || m.triboId === selectedTribo;
      return matchSearch && matchYear && matchTribo;
    });
  }, [musicas, searchQuery, selectedYear, selectedTribo]);

  const groupedMusicas = useMemo(() => {
    const groups = new Map<number, typeof filteredMusicas>();
    filteredMusicas.forEach((m) => {
      if (!groups.has(m.ano)) {
        groups.set(m.ano, []);
      }
      groups.get(m.ano)?.push(m);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, musicasList]) => ({
        year,
        musicas: musicasList.sort((a, b) => a.nome.localeCompare(b.nome)),
      }));
  }, [filteredMusicas]);

  const years = useMemo(() => {
    if (!musicas) return [];
    return [...new Set(musicas.map((m) => m.ano))].sort((a, b) => b - a);
  }, [musicas]);

  const handlePlayMusica = (musica: any) => {
    const playlist: PlaylistItem[] = filteredMusicas.map((m) => ({ musica: m }));
    const startIndex = playlist.findIndex((item) => item.musica.id === musica.id);
    play(playlist, startIndex >= 0 ? startIndex : 0);
  };

  return (
    <Box sx={{ minHeight: '100vh', paddingBottom: '320px', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%)' }}>
      <Header onSearch={setSearchQuery} onFilterYear={setSelectedYear} onFilterTribo={setSelectedTribo} years={years} tribos={tribos || []} />

      <Box sx={{ padding: '16px', maxWidth: 760, margin: '0 auto' }}>
        {musicasLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
            <CircularProgress />
          </Box>
        ) : musicasError ? (
          <Alert severity="error">Erro ao carregar músicas. Tente recarregar a página.</Alert>
        ) : filteredMusicas.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: '#999', padding: '40px 16px' }}>Nenhuma música encontrada</Typography>
        ) : (
          groupedMusicas.map(({ year, musicas: yearMusicas }) => (
            <Box key={year} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                📅 {year}
              </Typography>
              <Stack spacing={2}>
                {yearMusicas.reduce((acc: any[], musica) => {
                  const triboGroup = acc.find((g) => g.triboId === musica.triboId);
                  if (!triboGroup) {
                    acc.push({ triboId: musica.triboId, triboNome: musica.tribo?.nome, musicas: [musica] });
                  } else {
                    triboGroup.musicas.push(musica);
                  }
                  return acc;
                }, []).map((group: any) => (
                  <Box key={group.triboId}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: group.musicas[0]?.tribo?.cor || '#999', fontSize: '13px', fontWeight: 600 }}>
                      {group.triboNome}
                    </Typography>
                    <Stack spacing={1}>
                      {group.musicas.map((m: any) => (
                        <MusicaCard key={m.id} musica={m} onPlay={handlePlayMusica} isPlaying={state.currentTrack?.musica.id === m.id} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
