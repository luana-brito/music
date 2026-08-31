'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { CoverArt } from '@/components/ui/CoverArt';
import { useTribos, useCreateTribo, useUpdateTribo, useDeleteTribo, useUploadImagem } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tribo } from '@/types';
import { MAX_UPLOAD_LABEL } from '@/lib/uploadLimits';

const triboSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().min(1, 'Cor é obrigatória'),
});

type TriboInput = z.infer<typeof triboSchema>;

export default function TribosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: tribos, isLoading } = useTribos();
  const { mutate: createTribo, isPending: isCreating } = useCreateTribo();
  const { mutate: updateTribo, isPending: isUpdating } = useUpdateTribo();
  const { mutate: deleteTribo, isPending: isDeleting } = useDeleteTribo();
  const { mutate: uploadImagem, isPending: isUploadingImage } = useUploadImagem();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTribo, setEditingTribo] = useState<Tribo | null>(null);
  const [triboToDelete, setTriboToDelete] = useState<Tribo | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');
  const { register, handleSubmit, reset } = useForm<TriboInput>({
    resolver: zodResolver(triboSchema),
    defaultValues: { nome: '', cor: '#FF6B00' },
  });

  const isSaving = isCreating || isUpdating;

  const closeForm = () => {
    setOpenDialog(false);
    setEditingTribo(null);
    setLogoUrl('');
    setUploadError('');
    reset({ nome: '', cor: '#FF6B00' });
  };

  const openCreate = () => {
    setEditingTribo(null);
    setLogoUrl('');
    setUploadError('');
    setActionError('');
    reset({ nome: '', cor: '#FF6B00' });
    setOpenDialog(true);
  };

  const openEdit = (tribo: Tribo) => {
    setEditingTribo(tribo);
    setLogoUrl(tribo.logo || '');
    setUploadError('');
    setActionError('');
    reset({ nome: tribo.nome, cor: tribo.cor || '#FF6B00' });
    setOpenDialog(true);
  };

  const onSubmit = (data: TriboInput) => {
    const payload = { ...data, logo: logoUrl || null };
    if (editingTribo) {
      updateTribo(
        { id: editingTribo.id, ...payload },
        {
          onSuccess: closeForm,
          onError: (error) => {
            setActionError(
              axios.isAxiosError(error) ? (error.response?.data?.error as string) || 'Falha ao salvar' : 'Falha ao salvar'
            );
          },
        }
      );
      return;
    }

    createTribo(payload, {
      onSuccess: closeForm,
      onError: (error) => {
        setActionError(
          axios.isAxiosError(error) ? (error.response?.data?.error as string) || 'Falha ao criar' : 'Falha ao criar'
        );
      },
    });
  };

  const confirmDelete = () => {
    if (!triboToDelete) return;
    deleteTribo(triboToDelete.id, {
      onSuccess: () => {
        setTriboToDelete(null);
        setActionError('');
      },
      onError: (error) => {
        setActionError(
          axios.isAxiosError(error)
            ? (error.response?.data?.error as string) || 'Falha ao excluir'
            : 'Falha ao excluir'
        );
        setTriboToDelete(null);
      },
    });
  };

  return (
    <AdminLayout>
      <AdminPage
        title="Tribos"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            Nova Tribo
          </Button>
        }
      >

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
            {actionError}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          <Stack spacing={1}>
            {tribos?.map((tribo) => (
              <Box
                key={tribo.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                }}
              >
                <CoverArt name={tribo.nome} color={tribo.cor} src={tribo.logo} size={48} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontWeight: 700, fontSize: 14 }}>{tribo.nome}</Box>
                  <Box sx={{ width: 20, height: 8, background: tribo.cor, borderRadius: 1, mt: 0.6 }} />
                </Box>
                <IconButton size="small" color="primary" aria-label={`Editar ${tribo.nome}`} onClick={() => openEdit(tribo)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  aria-label={`Excluir ${tribo.nome}`}
                  onClick={() => {
                    setActionError('');
                    setTriboToDelete(tribo);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(255,107,0,0.12)' }}>
                  <TableCell>Imagem</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Cor</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tribos?.map((tribo) => (
                  <TableRow key={tribo.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>
                      <CoverArt name={tribo.nome} color={tribo.cor} src={tribo.logo} size={40} />
                    </TableCell>
                    <TableCell>{tribo.nome}</TableCell>
                    <TableCell>
                      <Box sx={{ width: 24, height: 24, background: tribo.cor, borderRadius: 1 }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" aria-label={`Editar ${tribo.nome}`} onClick={() => openEdit(tribo)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Excluir ${tribo.nome}`}
                        onClick={() => {
                          setActionError('');
                          setTriboToDelete(tribo);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Dialog open={openDialog} onClose={closeForm} fullScreen={isMobile} fullWidth maxWidth="sm">
          <DialogTitle>{editingTribo ? 'Editar Tribo' : 'Nova Tribo'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <ImageUploadField
                id="tribo-logo-upload"
                label="Enviar imagem"
                hint={`JPG, PNG, WEBP ou GIF até ${MAX_UPLOAD_LABEL}`}
                previewUrl={logoUrl}
                uploading={isUploadingImage}
                onFile={(file) => {
                  setUploadError('');
                  uploadImagem(file, {
                    onSuccess: (data) => setLogoUrl(data.url),
                    onError: (error) => {
                      setLogoUrl('');
                      setUploadError(
                        axios.isAxiosError(error)
                          ? (error.response?.data?.error as string) || 'Falha no upload'
                          : error instanceof Error
                            ? error.message
                            : 'Falha no upload'
                      );
                    },
                  });
                }}
                onClear={() => setLogoUrl('')}
              />
              {uploadError && <Alert severity="error">{uploadError}</Alert>}
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Cor" {...register('cor')} fullWidth type="color" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving || isUploadingImage}>
              {isSaving ? <CircularProgress size={24} /> : editingTribo ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(triboToDelete)} onClose={() => setTriboToDelete(null)} fullWidth maxWidth="xs">
          <DialogTitle>Excluir tribo?</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir <strong>{triboToDelete?.nome}</strong>? Essa ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTriboToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting}>
              {isDeleting ? <CircularProgress size={24} /> : 'Excluir'}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminPage>
    </AdminLayout>
  );
}
