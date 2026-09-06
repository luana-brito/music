'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useMusicas } from '@/hooks/useApi';
import { CoverArt } from '@/components/ui/CoverArt';
import { getCapaUrl } from '@/lib/capa';
import { MUTED } from '@/lib/theme';

interface AddSongsToPlaylistDialogProps {
  open: boolean;
  existingIds: string[];
  onAdd: (musicaIds: string[]) => void;
  onClose: () => void;
}

export function AddSongsToPlaylistDialog({ open, existingIds, onAdd, onClose }: AddSongsToPlaylistDialogProps) {
  const { data: musicas } = useMusicas();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const list = musicas || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (musica) =>
        musica.nome.toLowerCase().includes(q) ||
        musica.tribo?.nome.toLowerCase().includes(q) ||
        String(musica.ano).includes(q)
    );
  }, [musicas, query]);

  const reset = () => {
    setQuery('');
    setSelected([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    onAdd(selected);
    reset();
    onClose();
  };

  const toggle = (id: string, already: boolean) => {
    if (already) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: 'var(--surface)',
          backgroundImage: 'none',
          maxHeight: '85dvh',
        },
      }}
    >
      <DialogTitle>Adicionar músicas</DialogTitle>
      <DialogContent>
        <TextField
          placeholder="Buscar músicas"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          fullWidth
          sx={{ mt: 1, mb: 1 }}
        />
        <List dense sx={{ maxHeight: '50dvh', overflowY: 'auto' }}>
          {filtered.map((musica) => {
            const already = existingIds.includes(musica.id);
            const checked = already || selected.includes(musica.id);
            return (
              <ListItemButton key={musica.id} disabled={already} onClick={() => toggle(musica.id, already)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox edge="start" checked={checked} disabled={already} tabIndex={-1} disableRipple />
                </ListItemIcon>
                <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={40} rounded={4} shadow={false} />
                <ListItemText
                  sx={{ ml: 1.5, minWidth: 0 }}
                  primary={musica.nome}
                  secondary={already ? 'Já está na playlist' : musica.tribo?.nome}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true, sx: { color: MUTED } }}
                />
              </ListItemButton>
            );
          })}
        </List>
        {filtered.length === 0 && (
          <Typography sx={{ color: MUTED, textAlign: 'center', py: 3 }}>Nenhuma música encontrada</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleAdd} variant="contained" disabled={selected.length === 0}>
          Adicionar {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
