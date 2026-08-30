'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { MUTED } from '@/lib/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <Box sx={{ background: 'rgba(255,255,255,0.045)', p: 2.5, borderRadius: 2.4, border: '1px solid rgba(255,255,255,0.05)' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        Instalar aplicativo
      </Typography>
      {installed ? (
        <Typography variant="caption" sx={{ color: MUTED }}>
          O app já está instalado neste dispositivo.
        </Typography>
      ) : (
        <>
          <Typography variant="caption" sx={{ color: MUTED, display: 'block', mb: 1.5 }}>
            Instale o Música na tela inicial para usar como aplicativo, inclusive offline nas músicas baixadas.
          </Typography>
          <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleInstall} disabled={!deferredPrompt} sx={{ borderRadius: 999 }}>
            {deferredPrompt ? 'Instalar PWA' : 'Disponível no menu do navegador'}
          </Button>
        </>
      )}
    </Box>
  );
}
