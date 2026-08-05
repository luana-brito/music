'use client';

import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { MusicaCard } from '@/components/ui/MusicaCard';
import { usePlayer } from '@/hooks/usePlayer';
import { Musica } from '@/types';

export default function DownloadsPage() {
  const [offlineMusicas, setOfflineMusicas] = useState<Musica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { play } = usePlayer();

  useEffect(() => {
    const loadOfflineMusicas = async () => {
      try {
        const dbRequest = indexedDB.open('BibliotecaMusical', 1);
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const tx = db.transaction('musicas', 'readonly');
          const store = tx.objectStore('musicas');
          const allRecords: Musica[] = [];

          store.openCursor().onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
              allRecords.push(cursor.value.metadata);
              cursor.continue();
            } else {
              setOfflineMusicas(allRecords);
              setIsLoading(false);
            }
          };
        };
      } catch (error) {
        console.error('Erro ao carregar músicas offline:', error);
        setIsLoading(false);
      }
    };

    loadOfflineMusicas();
  }, []);

  const handlePlayMusica = (musica: Musica) => {
    const playlist = offlineMusicas.map((m) => ({ musica: m, isOffline: true }));
    const startIndex = playlist.findIndex((item) => item.musica.id === musica.id);
    play(playlist, startIndex >= 0 ? startIndex : 0);
  };

  const handleClearAll = () => {
    if (confirm('Deseja remover todas as músicas baixadas?')) {
      const dbRequest = indexedDB.open('BibliotecaMusical', 1);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.clear();
        localStorage.removeItem('offlineMusicas');
        setOfflineMusicas([]);
      };
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', paddingBottom: '320px', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%)' }}>
      <Header />

      <Box sx={{ padding: '16px', maxWidth: 760, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Downloads</Typography>
          {offlineMusicas.length > 0 && <Button variant="outlined" size="small" onClick={handleClearAll} color="error">
            Limpar
          </Button>}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
            <CircularProgress />
          </Box>
        ) : offlineMusicas.length === 0 ? (
          <Alert severity="info">Nenhuma música disponível offline. Baixe músicas para reproduzir sem internet.</Alert>
        ) : (
          <Stack spacing={2}>
            {offlineMusicas.map((m) => (
              <MusicaCard key={m.id} musica={m} onPlay={handlePlayMusica} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
