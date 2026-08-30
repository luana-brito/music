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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { useUsuarios, useCreateUsuario } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MUTED } from '@/lib/theme';

const createUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
});

type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export default function UsuariosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: usuarios, isLoading } = useUsuarios();
  const { mutate: createUsuario, isPending } = useCreateUsuario();
  const [openDialog, setOpenDialog] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateUsuarioInput>({
    resolver: zodResolver(createUsuarioSchema),
  });

  const onSubmit = (data: CreateUsuarioInput) => {
    createUsuario(data, {
      onSuccess: () => {
        reset();
        setOpenDialog(false);
      },
    });
  };

  return (
    <AdminLayout>
      <AdminPage
        title="Usuários"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)} sx={{ flexShrink: 0 }}>
            Novo Usuário
          </Button>
        }
      >
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
                <IconButton size="small" color="primary" aria-label={`Editar ${usuario.nome}`}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" color="error" aria-label={`Excluir ${usuario.nome}`}>
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
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios?.map((usuario) => (
                  <TableRow key={usuario.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{new Date(usuario.createdAt).toLocaleDateString('pt-BR')}</TableCell>
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullScreen={isMobile} fullWidth maxWidth="sm">
          <DialogTitle>Novo Usuário Administrativo</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Email" {...register('email')} fullWidth type="email" autoComplete="off" />
              <TextField label="Senha" {...register('senha')} fullWidth type="password" autoComplete="new-password" helperText="Mínimo de 8 caracteres" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isPending}>
              {isPending ? <CircularProgress size={24} /> : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </AdminPage>
    </AdminLayout>
  );
}
