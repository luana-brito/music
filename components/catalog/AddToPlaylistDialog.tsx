'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useUserPlaylists } from '@/hooks/useUserPlaylists';
import { MUTED, SURFACE } from '@/lib/theme';

const paperSx = {
  backgroundColor: SURFACE,
  backgroundImage: 'none',
};

interface AddToPlaylistDialogProps {
  open: boolean;
  musicaId: string | null;
  onClose: () => void;
}

export function AddToPlaylistDialog({ open, musicaId, onClose }: AddToPlaylistDialogProps) {
  const { playlists, create, addTrack } = useUserPlaylists();
  const [nome, setNome] = useState('');

  const handleCreate = () => {
    if (!musicaId) return;
    const created = create(nome || 'Minha playlist', [musicaId]);
    setNome('');
    if (created) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" sx={{ zIndex: 2200 }} PaperProps={{ sx: paperSx }}>
      <DialogTitle>Adicionar à playlist</DialogTitle>
      <DialogContent>
        {playlists.length === 0 && (
          <Typography sx={{ color: MUTED, fontSize: 14, mb: 1 }}>
            Você ainda não tem playlists. Crie uma abaixo.
          </Typography>
        )}
        <List>
          {playlists.map((playlist) => {
            const already = Boolean(musicaId && playlist.musicaIds.includes(musicaId));
            return (
              <ListItemButton
                key={playlist.id}
                disabled={already}
                onClick={() => {
                  if (!musicaId) return;
                  if (!already) addTrack(playlist.id, musicaId);
                  onClose();
                }}
              >
                <ListItemText
                  primary={playlist.nome}
                  secondary={already ? 'Já está nesta playlist' : `${playlist.musicaIds.length} músicas`}
                />
                {already && <CheckIcon sx={{ color: MUTED, fontSize: 18 }} />}
              </ListItemButton>
            );
          })}
        </List>
        <TextField
          label="Nova playlist"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!musicaId}>
          Criar e adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
