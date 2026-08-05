'use client';

import React, { useState } from 'react';
import { Box, Stack, Typography, Button, Switch, FormControlLabel, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Header } from '@/components/layout/Header';

export default function SettingsPage() {
  const [downloadOnWifiOnly, setDownloadOnWifiOnly] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    setCleared(true);
    setShowClearDialog(false);
    setTimeout(() => setCleared(false), 3000);
  };

  const handleClearDownloads = () => {
    if (confirm('Remover todas as músicas baixadas?')) {
      const dbRequest = indexedDB.open('BibliotecaMusical', 1);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.clear();
        localStorage.removeItem('offlineMusicas');
        setCleared(true);
        setTimeout(() => setCleared(false), 3000);
      };
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', paddingBottom: '120px', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%)' }}>
      <Header />

      <Box sx={{ padding: '16px', maxWidth: 760, margin: '0 auto' }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Configurações
        </Typography>

        <Stack spacing={2}>
          {cleared && <Alert severity="success">Concluído com sucesso!</Alert>}

          <Box sx={{ background: 'rgba(25,118,210,0.1)', p: 2, borderRadius: 2 }}>
            <FormControlLabel
              control={<Switch checked={downloadOnWifiOnly} onChange={(e) => setDownloadOnWifiOnly(e.target.checked)} />}
              label="Baixar apenas em Wi-Fi"
            />
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
              Economize dados desativando downloads em redes móveis
            </Typography>
          </Box>

          <Box sx={{ background: 'rgba(25,118,210,0.1)', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Espaço em Disco</Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Vazio: 2 GB (Ocupado pela app: ~500 MB)
            </Typography>
          </Box>

          <Box sx={{ background: 'rgba(25,118,210,0.1)', p: 2, borderRadius: 2 }}>
            <Button variant="outlined" fullWidth onClick={() => setShowClearDialog(true)}>
              Limpar Cache
            </Button>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
              Remove cópias em cache de imagens e páginas já carregadas
            </Typography>
          </Box>

          <Box sx={{ background: 'rgba(25,118,210,0.1)', p: 2, borderRadius: 2 }}>
            <Button variant="outlined" fullWidth onClick={handleClearDownloads} color="warning">
              Remover Downloads
            </Button>
            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
              Remover todas as músicas baixadas para reprodução offline
            </Typography>
          </Box>

          <Box sx={{ background: 'rgba(25,118,210,0.1)', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Sobre</Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Biblioteca Musical v1.0.0
            </Typography>
            <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
              Desenvolvido pela Igreja
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Limpar Cache?</DialogTitle>
        <DialogContent>
          <Typography>Deseja remover o cache de imagens e páginas? Isso pode aumentar o uso de dados.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancelar</Button>
          <Button onClick={handleClearCache} color="error" variant="contained">
            Limpar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
