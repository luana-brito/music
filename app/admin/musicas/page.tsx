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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useMusicas, useTribos, useCreateMusica, useUploadMusica } from '@/hooks/useApi';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createMusicaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  ano: z.number().min(1900),
  triboId: z.string().min(1, 'Tribo é obrigatória'),
  duracao: z.number().min(1),
});

type CreateMusicaInput = z.infer<typeof createMusicaSchema>;

export default function MusicasPage() {
  const { data: musicas, isLoading } = useMusicas();
  const { data: tribos } = useTribos();
  const { mutate: createMusica, isPending: isCreating } = useCreateMusica();
  const { mutate: uploadMusica, isPending: isUploading } = useUploadMusica();
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { register, handleSubmit, reset, control } = useForm<CreateMusicaInput>({
    resolver: zodResolver(createMusicaSchema),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(50);
    uploadMusica(file, {
      onSuccess: (data) => {
        setUploadedUrl(data.url);
        setUploadProgress(100);
      },
      onError: () => {
        setUploadProgress(0);
      },
    });
  };

  const onSubmit = (data: CreateMusicaInput) => {
    if (!uploadedUrl) {
      alert('Faça upload de uma música primeiro');
      return;
    }

    createMusica(
      { ...data, blobUrl: uploadedUrl },
      {
        onSuccess: () => {
          reset();
          setUploadedUrl('');
          setUploadProgress(0);
          setOpenDialog(false);
        },
      }
    );
  };

  return (
    <AdminLayout>
      <Box sx={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <h2>Músicas</h2>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenDialog(true);
              setUploadedUrl('');
              setUploadProgress(0);
            }}
          >
            Nova Música
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(25,118,210,0.1)' }}>
                  <TableCell>Nome</TableCell>
                  <TableCell>Ano</TableCell>
                  <TableCell>Tribo</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {musicas?.map((musica) => (
                  <TableRow key={musica.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>{musica.nome}</TableCell>
                    <TableCell>{musica.ano}</TableCell>
                    <TableCell>{musica.tribo?.nome}</TableCell>
                    <TableCell>{Math.floor(musica.duracao / 60)}:{(musica.duracao % 60).toString().padStart(2, '0')}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Nova Música</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {/* Upload de Arquivo */}
              <Box sx={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  accept="audio/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CloudUploadIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Button component="span" variant="outlined" disabled={isUploading}>
                      {isUploading ? 'Enviando...' : 'Selecione um arquivo de áudio'}
                    </Button>
                  </Box>
                </label>
                {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />}
                {uploadedUrl && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✓ Arquivo enviado com sucesso
                  </Alert>
                )}
              </Box>

              {/* Formulário */}
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Ano" {...register('ano', { valueAsNumber: true })} fullWidth type="number" />
              <Controller
                name="triboId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tribo</InputLabel>
                    <Select {...field} label="Tribo">
                      {tribos?.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <TextField label="Duração (segundos)" {...register('duracao', { valueAsNumber: true })} fullWidth type="number" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={isCreating || !uploadedUrl}
            >
              {isCreating ? <CircularProgress size={24} /> : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}

