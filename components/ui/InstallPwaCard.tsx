'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { MUTED, GREEN } from '@/lib/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaCardProps {
  compact?: boolean;
}

export function InstallPwaCard({ compact = false }: InstallPwaCardProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) {
      setInstalled(true);
      return;
    }

    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

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

  if (installed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setIosHelp(true);
  };

  const help = (
    <Dialog open={iosHelp} onClose={() => setIosHelp(false)}>
      <DialogTitle>Instalar o app</DialogTitle>
      <DialogContent>
        {isIos ? (
          <Typography>
            No Safari, toque em Compartilhar e depois em <strong>Adicionar à Tela de Início</strong>.
          </Typography>
        ) : (
          <Typography>
            Abra o menu do navegador e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIosHelp(false)}>Entendi</Button>
      </DialogActions>
    </Dialog>
  );

  if (compact) {
    return (
      <>
        <Button
          variant="contained"
          startIcon={<GetAppIcon />}
          onClick={handleInstall}
          sx={{ borderRadius: 999, fontWeight: 700, px: 2 }}
        >
          Baixar o app
        </Button>
        {help}
      </>
    );
  }

  return (
    <Box sx={{ background: 'rgba(255,255,255,0.045)', p: 2.5, borderRadius: 2.4, border: '1px solid rgba(255,255,255,0.05)' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
        Instalar aplicativo
      </Typography>
      <Typography variant="caption" sx={{ color: MUTED, display: 'block', mb: 1.5 }}>
        Instale o Hype na tela inicial para usar como aplicativo, inclusive offline nas músicas baixadas.
      </Typography>
      <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleInstall} sx={{ borderRadius: 999, background: GREEN, color: '#000' }}>
        Baixar o app
      </Button>
      {help}
    </Box>
  );
}
