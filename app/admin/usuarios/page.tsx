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
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MUTED } from '@/lib/theme';
import { Usuario } from '@/types';

const usuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().optional().or(z.literal('')),
});

type UsuarioInput = z.infer<typeof usuarioSchema>;

function apiMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data?.error;
  return typeof data === 'string' ? data : fallback;
}

export default function UsuariosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: session } = useSession();
  const { data: usuarios, isLoading } = useUsuarios();
  const { mutate: createUsuario, isPending: isCreating } = useCreateUsuario();
  const { mutate: updateUsuario, isPending: isUpdating } = useUpdateUsuario();
  const { mutate: deleteUsuario, isPending: isDeleting } = useDeleteUsuario();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [actionError, setActionError] = useState('');
  const { register, handleSubmit, reset } = useForm<UsuarioInput>({
    resolver: zodResolver(usuarioSchema),
  });

  const isSaving = isCreating || isUpdating;

  const closeForm = () => {
    setOpenDialog(false);
    setEditingUsuario(null);
    reset({ nome: '', email: '', senha: '' });
  };

  const openCreate = () => {
    setEditingUsuario(null);
    setActionError('');
    reset({ nome: '', email: '', senha: '' });
    setOpenDialog(true);
  };

  const openEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setActionError('');
    reset({ nome: usuario.nome, email: usuario.email, senha: '' });
    setOpenDialog(true);
  };

  const onSubmit = (data: UsuarioInput) => {
    if (!editingUsuario && (!data.senha || data.senha.length < 8)) {
      setActionError('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (editingUsuario && data.senha && data.senha.length < 8) {
      setActionError('A nova senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (editingUsuario) {
      updateUsuario(
        { id: editingUsuario.id, nome: data.nome, email: data.email, senha: data.senha || undefined },
        {
          onSuccess: closeForm,
          onError: (error) => setActionError(apiMessage(error, 'Falha ao salvar')),
        }
      );
      return;
    }

    createUsuario(
      { nome: data.nome, email: data.email, senha: data.senha || '' },
      {
        onSuccess: closeForm,
        onError: (error) => setActionError(apiMessage(error, 'Falha ao criar')),
      }
    );
  };

  const confirmDelete = () => {
    if (!usuarioToDelete) return;
    deleteUsuario(usuarioToDelete.id, {
      onSuccess: () => {
        setUsuarioToDelete(null);
        setActionError('');
      },
      onError: (error) => {
        setActionError(apiMessage(error, 'Falha ao excluir'));
        setUsuarioToDelete(null);
      },
    });
  };

  const actions = (usuario: Usuario) => (
    <>
      <IconButton size="small" color="primary" aria-label={`Editar ${usuario.nome}`} onClick={() => openEdit(usuario)}>
        <EditIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        aria-label={`Excluir ${usuario.nome}`}
        disabled={usuario.id === session?.user?.id}
        onClick={() => {
          setActionError('');
          setUsuarioToDelete(usuario);
        }}
      >
        <DeleteIcon />
      </IconButton>
    </>
  );

  return (
    <AdminLayout>
      <AdminPage
        title="Usuários"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            Novo Usuário
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
            {usuarios?.map((usuario) => (
              <Box
                key={usuario.id}
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
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ fontWeight: 700, fontSize: 14 }}>{usuario.nome}</Box>
                  <Box sx={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.email}</Box>
                </Box>
                {actions(usuario)}
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios?.map((usuario) => (
                  <TableRow key={usuario.id} sx={{ '&:hover': { background: 'var(--surface-hover)' } }}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{new Date(usuario.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{actions(usuario)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Dialog open={openDialog} onClose={closeForm} fullWidth maxWidth="sm">
          <DialogTitle>{editingUsuario ? 'Editar Usuário' : 'Novo Usuário Administrativo'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Email" {...register('email')} fullWidth type="email" autoComplete="off" />
              <TextField
                label={editingUsuario ? 'Nova senha' : 'Senha'}
                {...register('senha')}
                fullWidth
                type="password"
                autoComplete="new-password"
                helperText={editingUsuario ? 'Deixe em branco para manter a senha atual' : 'Mínimo de 8 caracteres'}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={24} /> : editingUsuario ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(usuarioToDelete)} onClose={() => setUsuarioToDelete(null)} fullWidth maxWidth="xs">
          <DialogTitle>Excluir usuário?</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir <strong>{usuarioToDelete?.nome}</strong>? Essa ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUsuarioToDelete(null)} disabled={isDeleting}>
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
