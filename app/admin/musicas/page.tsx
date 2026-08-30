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
  Typography,
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
import {
  useMusicas,
  useTribos,
  useCreateMusica,
  useUpdateMusica,
  useDeleteMusica,
  useUploadMusica,
  useUploadImagem,
} from '@/hooks/useApi';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCapaUrl } from '@/lib/capa';
import { formatDuration } from '@/lib/format';
import { readAudioDuration } from '@/lib/audioDuration';
import { MUTED } from '@/lib/theme';
import { Musica } from '@/types';

const musicaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  ano: z.number().min(1900),
  triboId: z.string().min(1, 'Tribo é obrigatória'),
  duracao: z.number().min(1),
});

type MusicaInput = z.infer<typeof musicaSchema>;

function apiMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data?.error;
  return typeof data === 'string' ? data : fallback;
}

export default function MusicasPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: musicas, isLoading } = useMusicas();
  const { data: tribos } = useTribos();
  const { mutate: createMusica, isPending: isCreating } = useCreateMusica();
  const { mutate: updateMusica, isPending: isUpdating } = useUpdateMusica();
  const { mutate: deleteMusica, isPending: isDeleting } = useDeleteMusica();
  const { mutate: uploadMusica, isPending: isUploading } = useUploadMusica();
  const { mutate: uploadImagem, isPending: isUploadingImage } = useUploadImagem();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMusica, setEditingMusica] = useState<Musica | null>(null);
  const [musicaToDelete, setMusicaToDelete] = useState<Musica | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [capaUrl, setCapaUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [actionError, setActionError] = useState('');
  const { register, handleSubmit, reset, control, watch, setValue } = useForm<MusicaInput>({
    resolver: zodResolver(musicaSchema),
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
  const isSaving = isCreating || isUpdating;

  const closeForm = () => {
    setOpenDialog(false);
    setEditingMusica(null);
    setUploadedUrl('');
    setCapaUrl('');
    setUploadProgress(0);
    setUploadError('');
    reset({
      nome: '',
      ano: new Date().getFullYear(),
      triboId: '',
      duracao: 0,
    });
  };

  const openCreate = () => {
    setEditingMusica(null);
    setUploadedUrl('');
    setCapaUrl('');
    setUploadProgress(0);
    setUploadError('');
    setActionError('');
    reset({
      nome: '',
      ano: new Date().getFullYear(),
      triboId: '',
      duracao: 0,
    });
    setOpenDialog(true);
  };

  const openEdit = (musica: Musica) => {
    setEditingMusica(musica);
    setUploadedUrl(musica.blobUrl);
    setCapaUrl(musica.capa || '');
    setUploadProgress(0);
    setUploadError('');
    setActionError('');
    reset({
      nome: musica.nome,
      ano: musica.ano,
      triboId: musica.triboId,
      duracao: musica.duracao,
    });
    setOpenDialog(true);
  };

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
        setUploadError(apiMessage(error, 'Falha no upload do arquivo'));
        if (!editingMusica) setUploadedUrl('');
        setUploadProgress(0);
      },
    });
  };

  const onSubmit = (data: MusicaInput) => {
    if (!uploadedUrl) {
      setActionError('Faça upload de uma música primeiro');
      return;
    }

    const payload = { ...data, blobUrl: uploadedUrl, capa: capaUrl || null };

    if (editingMusica) {
      updateMusica(
        { id: editingMusica.id, ...payload },
        {
          onSuccess: closeForm,
          onError: (error) => setActionError(apiMessage(error, 'Falha ao salvar')),
        }
      );
      return;
    }

    createMusica(payload, {
      onSuccess: closeForm,
      onError: (error) => setActionError(apiMessage(error, 'Falha ao criar')),
    });
  };

  const confirmDelete = () => {
    if (!musicaToDelete) return;
    deleteMusica(musicaToDelete.id, {
      onSuccess: () => {
        setMusicaToDelete(null);
        setActionError('');
      },
      onError: (error) => {
        setActionError(apiMessage(error, 'Falha ao excluir'));
        setMusicaToDelete(null);
      },
    });
  };

  const actions = (musica: Musica) => (
    <>
      <IconButton size="small" color="primary" aria-label={`Editar ${musica.nome}`} onClick={() => openEdit(musica)}>
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        aria-label={`Excluir ${musica.nome}`}
        onClick={() => {
          setActionError('');
          setMusicaToDelete(musica);
        }}
      >
        <DeleteIcon />
      </IconButton>
    </>
  );

  return (
    <AdminLayout>
      <AdminPage
        title="Músicas"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            Nova Música
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
                {actions(musica)}
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
                    <TableCell>{actions(musica)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Dialog open={openDialog} onClose={closeForm} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>{editingMusica ? 'Editar Música' : 'Nova Música'}</DialogTitle>
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
                      {isUploading ? 'Enviando...' : editingMusica ? 'Trocar arquivo de áudio' : 'Selecione um arquivo de áudio'}
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
                    {editingMusica && uploadProgress === 0 ? 'Arquivo atual será mantido' : 'Arquivo enviado com sucesso'}
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
            <Button onClick={closeForm}>Cancelar</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={isSaving || !uploadedUrl || isUploadingImage || detectedDuration < 1}
            >
              {isSaving ? <CircularProgress size={24} /> : editingMusica ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(musicaToDelete)} onClose={() => setMusicaToDelete(null)} fullWidth maxWidth="xs">
          <DialogTitle>Excluir música?</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir <strong>{musicaToDelete?.nome}</strong>? Essa ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMusicaToDelete(null)} disabled={isDeleting}>
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
