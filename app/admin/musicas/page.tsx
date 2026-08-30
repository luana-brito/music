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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { CoverArt } from '@/components/ui/CoverArt';
import { useMusicas, useTribos, useCreateMusica, useUploadMusica, useUploadImagem } from '@/hooks/useApi';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCapaUrl } from '@/lib/capa';
import { formatDuration } from '@/lib/format';
import { readAudioDuration } from '@/lib/audioDuration';
import { MUTED } from '@/lib/theme';

const createMusicaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  ano: z.number().min(1900),
  triboId: z.string().min(1, 'Tribo é obrigatória'),
  duracao: z.number().min(1),
});

type CreateMusicaInput = z.infer<typeof createMusicaSchema>;

export default function MusicasPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: musicas, isLoading } = useMusicas();
  const { data: tribos } = useTribos();
  const { mutate: createMusica, isPending: isCreating } = useCreateMusica();
  const { mutate: uploadMusica, isPending: isUploading } = useUploadMusica();
  const { mutate: uploadImagem, isPending: isUploadingImage } = useUploadImagem();
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [capaUrl, setCapaUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const { register, handleSubmit, reset, control, watch, setValue } = useForm<CreateMusicaInput>({
    resolver: zodResolver(createMusicaSchema),
    defaultValues: {
      nome: '',
      ano: new Date().getFullYear(),
      triboId: '',
      duracao: 0,
    },
  });

  const selectedTriboId = watch('triboId');
  const selectedTribo = tribos?.find((t) => t.id === selectedTriboId);
  const capaPreview = capaUrl || selectedTribo?.logo || '';
  const detectedDuration = watch('duracao');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadProgress(50);
    readAudioDuration(file).then((seconds) => setValue('duracao', seconds));
    uploadMusica(file, {
      onSuccess: (data) => {
        setUploadedUrl(data.url);
        setUploadProgress(100);
      },
      onError: (error) => {
        const message = axios.isAxiosError(error)
          ? (error.response?.data?.error as string) || 'Falha no upload do arquivo'
          : 'Falha no upload do arquivo';
        setUploadError(message);
        setUploadedUrl('');
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
      { ...data, blobUrl: uploadedUrl, capa: capaUrl || null },
      {
        onSuccess: () => {
          reset();
          setUploadedUrl('');
          setCapaUrl('');
          setUploadProgress(0);
          setOpenDialog(false);
        },
      }
    );
  };

  const resetDialog = () => {
    setOpenDialog(true);
    setUploadedUrl('');
    setCapaUrl('');
    setUploadProgress(0);
    setUploadError('');
  };

  return (
    <AdminLayout>
      <AdminPage
        title="Músicas"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={resetDialog} sx={{ flexShrink: 0 }}>
            Nova Música
          </Button>
        }
      >

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          <Stack spacing={1}>
            {musicas?.map((musica) => (
              <Box
                key={musica.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  minWidth: 0,
                }}
              >
                <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={48} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {musica.nome}
                  </Box>
                  <Box sx={{ color: MUTED, fontSize: 12 }}>
                    {musica.tribo?.nome} • {musica.ano} • {formatDuration(musica.duracao)}
                  </Box>
                </Box>
                <IconButton size="small" color="primary" aria-label={`Editar ${musica.nome}`}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" color="error" aria-label={`Excluir ${musica.nome}`}>
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
                  <TableCell>Capa</TableCell>
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
                    <TableCell>
                      <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={40} />
                    </TableCell>
                    <TableCell>{musica.nome}</TableCell>
                    <TableCell>{musica.ano}</TableCell>
                    <TableCell>{musica.tribo?.nome}</TableCell>
                    <TableCell>{formatDuration(musica.duracao)}</TableCell>
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>Nova Música</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box sx={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  accept=".mp3,.mpeg,audio/mpeg,audio/mp3,audio/x-mpeg,video/mpeg"
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
                {uploadError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {uploadError}
                  </Alert>
                )}
                {uploadedUrl && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Arquivo enviado com sucesso
                  </Alert>
                )}
              </Box>

              <ImageUploadField
                id="musica-capa-upload"
                label="Enviar capa"
                hint="Opcional. Sem capa, usa a imagem da tribo."
                previewUrl={capaPreview}
                uploading={isUploadingImage}
                onFile={(file) => {
                  uploadImagem(file, {
                    onSuccess: (data) => setCapaUrl(data.url),
                  });
                }}
                onClear={() => setCapaUrl('')}
              />

              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Ano" {...register('ano', { valueAsNumber: true })} fullWidth type="number" />
              <Controller
                name="triboId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tribo</InputLabel>
                    <Select {...field} value={field.value ?? ''} label="Tribo">
                      {tribos?.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <TextField
                label="Duração"
                value={detectedDuration >= 1 ? formatDuration(detectedDuration) : 'Lida automaticamente do áudio'}
                fullWidth
                disabled
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isCreating || !uploadedUrl || isUploadingImage || detectedDuration < 1}>
              {isCreating ? <CircularProgress size={24} /> : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminPage>
    </AdminLayout>
  );
}
