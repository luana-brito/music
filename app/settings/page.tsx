'use client';

import React, { useState } from 'react';
import { Box, Stack, Typography, Button, Switch, FormControlLabel, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Header } from '@/components/layout/Header';
import { MUTED, pageBg } from '@/lib/theme';
import { APP_DEVELOPER, APP_NAME, APP_VERSION } from '@/lib/appInfo';
import { InstallPwaCard } from '@/components/ui/InstallPwaCard';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
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

  const cardSx = {
    background: 'rgba(255,255,255,0.045)',
    p: 2.5,
    borderRadius: 2.4,
    border: '1px solid rgba(255,255,255,0.05)',
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: pageBg(),
      }}
    >
      <Header title="Configurações" />

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4, maxWidth: 720 }}>
        <Stack spacing={2}>
          {cleared && <Alert severity="success">Concluído com sucesso!</Alert>}

          <InstallPwaCard />

          <Box sx={cardSx}>
            <FormControlLabel
              control={<Switch checked={downloadOnWifiOnly} onChange={(e) => setDownloadOnWifiOnly(e.target.checked)} />}
              label="Baixar apenas em Wi-Fi"
            />
            <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1 }}>
              Economize dados desativando downloads em redes móveis
            </Typography>
          </Box>

          <Box sx={cardSx}>
            <Button variant="outlined" fullWidth onClick={() => setShowClearDialog(true)} sx={{ borderRadius: 999 }}>
              Limpar cache
            </Button>
            <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1 }}>
              Remove cópias em cache de imagens e páginas já carregadas
            </Typography>
          </Box>

          <Box sx={cardSx}>
            <Button
              variant="contained"
              fullWidth
              href={isAdmin ? '/admin' : '/login'}
              sx={{ borderRadius: 999 }}
            >
              {isAdmin ? 'Abrir painel admin' : 'Entrar no admin'}
            </Button>
            <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1 }}>
              {isAdmin ? 'Gerencie músicas, tribos e usuários' : 'Acesso restrito aos administradores'}
            </Typography>
          </Box>

          <Box sx={cardSx}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              Sobre
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>
              {APP_NAME} v{APP_VERSION}
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED, display: 'block' }}>
              Desenvolvido pelo {APP_DEVELOPER}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Limpar cache?</DialogTitle>
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
