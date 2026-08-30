'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { FilterBar } from '@/components/catalog/FilterBar';
import { PlaylistCard } from '@/components/catalog/PlaylistCard';
import { useUserPlaylists } from '@/hooks/useUserPlaylists';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { usePlayer } from '@/hooks/usePlayer';
import { MUTED, ORANGE } from '@/lib/theme';
import { Musica, PlaylistItem, Tribo } from '@/types';
import { UserPlaylist } from '@/lib/userPlaylists';

function playlistTracks(playlist: UserPlaylist, musicas: Musica[]) {
  return playlist.musicaIds
    .map((id) => musicas.find((musica) => musica.id === id))
    .filter((musica): musica is Musica => Boolean(musica));
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { playlists, ready, create } = useUserPlaylists();
  const { data: musicas } = useMusicas();
  const { data: tribos } = useTribos();
  const { play } = usePlayer();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const catalog = musicas || [];
  const allPlaylistTracks = useMemo(
    () => playlists.flatMap((playlist) => playlistTracks(playlist, catalog)),
    [playlists, catalog]
  );
  const filters = useCatalogFilters(allPlaylistTracks);

  const visiblePlaylists = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    const list = playlists.filter((playlist) => {
      if (query && !playlist.nome.toLowerCase().includes(query)) return false;
      const tracks = playlistTracks(playlist, catalog);
      if (filters.selectedYear && !tracks.some((musica) => musica.ano === filters.selectedYear)) return false;
      if (filters.selectedTribo && !tracks.some((musica) => musica.triboId === filters.selectedTribo)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const tracksA = playlistTracks(a, catalog);
      const tracksB = playlistTracks(b, catalog);
      if (filters.sort === 'name') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (filters.sort === 'year') {
        const yearA = Math.max(0, ...tracksA.map((musica) => musica.ano));
        const yearB = Math.max(0, ...tracksB.map((musica) => musica.ano));
        return yearB - yearA;
      }
      if (filters.sort === 'recent') return b.createdAt - a.createdAt;
      const playsA = tracksA.reduce((sum, musica) => sum + (musica.plays || 0), 0);
      const playsB = tracksB.reduce((sum, musica) => sum + (musica.plays || 0), 0);
      return playsB - playsA;
    });
  }, [playlists, catalog, filters.searchQuery, filters.selectedYear, filters.selectedTribo, filters.sort]);

  const handleCreate = () => {
    const created = create(nome);
    setNome('');
    setOpen(false);
    router.push(`/playlists/${created.id}` as never);
  };

  const playlistTribos: Tribo[] = tribos || [];

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(180deg, rgba(255,107,0,0.2) 0%, #121212 260px)' }}>
      <Header
        title="Playlists"
        searchQuery={filters.searchQuery}
        onSearch={playlists.length > 0 ? filters.setSearchQuery : undefined}
        searchPlaceholder="Buscar playlists"
      />
      {playlists.length > 0 && (
        <FilterBar
          years={filters.years}
          tribos={playlistTribos}
          selectedYear={filters.selectedYear}
          selectedTribo={filters.selectedTribo}
          sort={filters.sort}
          hasFilters={filters.hasFilters}
          onYear={filters.setSelectedYear}
          onTribo={filters.setSelectedTribo}
          onSort={filters.setSort}
          onClear={filters.clearFilters}
        />
      )}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ mb: 3 }}>
          Nova playlist
        </Button>

        {!ready ? null : playlists.length === 0 ? (
          <Typography sx={{ color: MUTED }}>Crie uma playlist para organizar suas músicas.</Typography>
        ) : visiblePlaylists.length === 0 ? (
          <Typography sx={{ color: MUTED }}>Nenhuma playlist encontrada com esses filtros.</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {visiblePlaylists.map((playlist) => {
              const tracks = playlistTracks(playlist, catalog);
              return (
                <PlaylistCard
                  key={playlist.id}
                  name={playlist.nome}
                  color={ORANGE}
                  count={playlist.musicaIds.length}
                  src={tracks[0] ? tracks[0].capa || tracks[0].tribo?.logo : null}
                  fullWidth
                  onSelect={() => router.push(`/playlists/${playlist.id}` as never)}
                  onPlay={() => {
                    const items: PlaylistItem[] = tracks.map((musica) => ({ musica }));
                    if (items.length) play(items, 0);
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { backgroundColor: '#181818', backgroundImage: 'none' } }}
      >
        <DialogTitle>Nova playlist</DialogTitle>
        <DialogContent>
          <Stack sx={{ mt: 1 }}>
            <TextField label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!nome.trim()}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
