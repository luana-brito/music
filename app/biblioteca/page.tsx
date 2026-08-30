'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { FilterBar } from '@/components/catalog/FilterBar';
import { TrackList } from '@/components/catalog/TrackList';
import { AddToPlaylistDialog } from '@/components/catalog/AddToPlaylistDialog';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { usePlayer } from '@/hooks/usePlayer';
import { MUTED, ORANGE, pageBg } from '@/lib/theme';
import { Musica, PlaylistItem } from '@/types';

function BibliotecaContent() {
  const searchParams = useSearchParams();
  const { data: musicas, isLoading, error } = useMusicas();
  const { data: tribos } = useTribos();
  const { play } = usePlayer();
  const filters = useCatalogFilters(musicas);
  const [addMusicaId, setAddMusicaId] = useState<string | null>(null);

  useEffect(() => {
    const year = searchParams.get('year');
    const tribo = searchParams.get('tribo');
    if (year) filters.setSelectedYear(Number(year));
    if (tribo) filters.setSelectedTribo(tribo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePlay = (musica: Musica) => {
    const playlist: PlaylistItem[] = filters.filteredMusicas.map((item) => ({ musica: item }));
    const startIndex = playlist.findIndex((item) => item.musica.id === musica.id);
    play(playlist, startIndex >= 0 ? startIndex : 0);
  };

  return (
    <Box sx={{ minHeight: '100%', background: pageBg() }}>
      <Header title="Biblioteca" searchQuery={filters.searchQuery} onSearch={filters.setSearchQuery} />
      <FilterBar
        years={filters.years}
        tribos={tribos || []}
        selectedYear={filters.selectedYear}
        selectedTribo={filters.selectedTribo}
        sort={filters.sort}
        hasFilters={filters.hasFilters}
        onYear={filters.setSelectedYear}
        onTribo={filters.setSelectedTribo}
        onSort={filters.setSort}
        onClear={filters.clearFilters}
      />
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
        {isLoading && !musicas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: ORANGE }} />
          </Box>
        ) : error ? (
          <Alert severity="error">Erro ao carregar músicas.</Alert>
        ) : (
          <TrackList
            musicas={filters.filteredMusicas}
            onPlay={handlePlay}
            onAdd={(musica) => setAddMusicaId(musica.id)}
          />
        )}
      </Box>
      <AddToPlaylistDialog open={Boolean(addMusicaId)} musicaId={addMusicaId} onClose={() => setAddMusicaId(null)} />
    </Box>
  );
}

export default function BibliotecaPage() {
  return (
    <Suspense fallback={<Box sx={{ color: MUTED, p: 4 }}>Carregando biblioteca…</Box>}>
      <BibliotecaContent />
    </Suspense>
  );
}
