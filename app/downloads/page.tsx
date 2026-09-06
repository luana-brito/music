'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { FilterBar } from '@/components/catalog/FilterBar';
import { TrackList } from '@/components/catalog/TrackList';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { usePlayer } from '@/hooks/usePlayer';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useMusicas } from '@/hooks/useApi';
import { uniqueYears } from '@/lib/catalog';
import { listOfflineMusicas } from '@/lib/offlineDb';
import { MUTED, PURPLE, PURPLE_SOFT, pageBg } from '@/lib/theme';
import { Musica, Tribo } from '@/types';

export default function DownloadsPage() {
  const [offlineMusicas, setOfflineMusicas] = useState<Musica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { play, state, downloadOffline, removeOffline } = usePlayer();
  const { data: catalog } = useMusicas();
  const online = useOnlineStatus();
  const filters = useCatalogFilters(offlineMusicas);

  const tribos = Array.from(
    new Map(
      offlineMusicas
        .map((musica) => musica.tribo)
        .filter((tribo): tribo is Tribo => Boolean(tribo))
        .map((tribo) => [tribo.id, tribo])
    ).values()
  );

  const reload = async () => {
    const records = await listOfflineMusicas();
    setOfflineMusicas(records);
  };

  useEffect(() => {
    reload().finally(() => setIsLoading(false));
  }, []);

  const handleSaveLibrary = async () => {
    if (!catalog?.length) return;
    setSaving(true);
    try {
      const missing = catalog.filter((musica) => !offlineMusicas.some((item) => item.id === musica.id));
      for (const musica of missing) {
        await downloadOffline(musica);
      }
      await reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100%', background: pageBg() }}>
      <Header
        title="Downloads"
        searchQuery={filters.searchQuery}
        onSearch={offlineMusicas.length > 0 ? filters.setSearchQuery : undefined}
        searchPlaceholder="Buscar downloads"
      />
      {offlineMusicas.length > 0 && (
        <FilterBar
          years={uniqueYears(offlineMusicas)}
          tribos={tribos}
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
        {!online && (
          <Alert severity="info" sx={{ mb: 2, background: PURPLE_SOFT, color: '#fff', borderRadius: 2 }}>
            Você está offline. Reproduzindo apenas as músicas baixadas.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ color: MUTED, fontSize: 14 }}>
            {offlineMusicas.length} {offlineMusicas.length === 1 ? 'música disponível' : 'músicas disponíveis'} offline
          </Typography>
          {online && (
            <Button variant="contained" size="small" onClick={handleSaveLibrary} disabled={saving || !catalog?.length}>
              {saving ? 'Salvando…' : 'Salvar biblioteca offline'}
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: PURPLE }} />
          </Box>
        ) : offlineMusicas.length === 0 ? (
          <Alert severity="info" sx={{ background: PURPLE_SOFT, color: '#fff', borderRadius: 2 }}>
            Nenhuma música disponível offline. Use “Salvar biblioteca offline” para ouvir sem internet.
          </Alert>
        ) : (
          <TrackList
            musicas={filters.filteredMusicas}
            onPlay={(musica) => {
              const playlist = filters.filteredMusicas.map((item) => ({ musica: item, isOffline: true }));
              const startIndex = playlist.findIndex((item) => item.musica.id === musica.id);
              play(playlist, startIndex >= 0 ? startIndex : 0);
            }}
            onRemove={async (musica) => {
              await removeOffline(musica.id);
              await reload();
            }}
          />
        )}
      </Box>
    </Box>
  );
}
