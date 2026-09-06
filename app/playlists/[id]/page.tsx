'use client';

import React, { useMemo, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { TrackList } from '@/components/catalog/TrackList';
import { FilterBar } from '@/components/catalog/FilterBar';
import { AddSongsToPlaylistDialog } from '@/components/catalog/AddSongsToPlaylistDialog';
import { CoverArt } from '@/components/ui/CoverArt';
import { useUserPlaylists } from '@/hooks/useUserPlaylists';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { usePlayer } from '@/hooks/usePlayer';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { MUTED, PURPLE, pageBg } from '@/lib/theme';
import { getCapaUrl } from '@/lib/capa';
import { PlaylistItem } from '@/types';

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { playlists, ready, remove, removeTrack, addTracks } = useUserPlaylists();
  const { data: musicas } = useMusicas();
  const { data: tribos } = useTribos();
  const { play, downloadOffline, isOffline } = usePlayer();
  const online = useOnlineStatus();
  const playlist = playlists.find((item) => item.id === params.id);
  const [addOpen, setAddOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const tracks = useMemo(() => {
    if (!playlist || !musicas) return [];
    return playlist.musicaIds
      .map((id) => musicas.find((musica) => musica.id === id))
      .filter((musica): musica is NonNullable<typeof musica> => Boolean(musica));
  }, [playlist, musicas]);

  const filters = useCatalogFilters(tracks);
  const missingOffline = tracks.filter((musica) => !isOffline(musica.id));

  const handleDownload = async () => {
    if (!missingOffline.length) return;
    setDownloading(true);
    try {
      for (let index = 0; index < missingOffline.length; index += 1) {
        setDownloadProgress(`${index + 1}/${missingOffline.length}`);
        await downloadOffline(missingOffline[index]);
      }
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  if (!ready) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography sx={{ color: MUTED }}>Carregando playlist…</Typography>
      </Box>
    );
  }

  if (!playlist) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography sx={{ color: MUTED }}>Playlist não encontrada.</Typography>
        <Button onClick={() => router.push('/playlists' as never)} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  const accent = tracks[0]?.tribo?.cor || PURPLE;

  return (
    <Box sx={{ minHeight: '100%', background: pageBg(accent) }}>
      <Header
        searchQuery={filters.searchQuery}
        onSearch={tracks.length > 0 ? filters.setSearchQuery : undefined}
        searchPlaceholder="Buscar nesta playlist"
      />
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          pb: 3,
          display: 'flex',
          gap: { xs: 2, md: 3.5 },
          alignItems: { xs: 'center', md: 'flex-end' },
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box sx={{ width: { xs: 180, md: 232 }, flexShrink: 0 }}>
          <CoverArt
            name={playlist.nome}
            color={accent}
            src={tracks[0] ? getCapaUrl(tracks[0]) : null}
            size="100%"
            rounded={12}
          />
        </Box>
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1.4 }}>PLAYLIST</Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 32, md: 56 },
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
              mt: 0.5,
              mb: 1,
            }}
          >
            {playlist.nome}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mb: 2 }}>
            {filters.filteredMusicas.length} {filters.filteredMusicas.length === 1 ? 'música' : 'músicas'}
            {tracks.length > 0 ? ` • ${tracks.length - missingOffline.length} offline` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              disabled={tracks.length === 0}
              onClick={() => play(tracks.map((musica) => ({ musica })) as PlaylistItem[], 0)}
              sx={{ px: 3, py: 1 }}
            >
              Tocar
            </Button>
            <Button variant="outlined" startIcon={<PlaylistAddIcon />} onClick={() => setAddOpen(true)}>
              Adicionar músicas
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleDownload}
              disabled={!online || downloading || missingOffline.length === 0}
            >
              {downloading
                ? `Baixando ${downloadProgress}`
                : missingOffline.length === 0 && tracks.length > 0
                  ? 'Playlist baixada'
                  : 'Baixar playlist'}
            </Button>
            <Button
              color="error"
              onClick={() => {
                remove(playlist.id);
                router.push('/playlists' as never);
              }}
            >
              Excluir playlist
            </Button>
          </Box>
        </Box>
      </Box>
      {tracks.length > 0 && (
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
      )}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
        <TrackList
          musicas={filters.filteredMusicas}
          onPlay={(musica) => {
            const items = filters.filteredMusicas.map((item) => ({ musica: item }));
            const startIndex = items.findIndex((item) => item.musica.id === musica.id);
            play(items, startIndex >= 0 ? startIndex : 0);
          }}
          onRemove={(musica) => removeTrack(playlist.id, musica.id)}
        />
        {tracks.length === 0 && (
          <Typography sx={{ color: MUTED, mt: 2 }}>
            Esta playlist está vazia. Use “Adicionar músicas” para incluir faixas.
          </Typography>
        )}
      </Box>
      <AddSongsToPlaylistDialog
        open={addOpen}
        existingIds={playlist.musicaIds}
        onAdd={(ids) => addTracks(playlist.id, ids)}
        onClose={() => setAddOpen(false)}
      />
    </Box>
  );
}
