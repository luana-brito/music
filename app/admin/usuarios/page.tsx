'use client';

import React, { useState } from 'react';
import { Box, Stack, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useUsuarios, useCreateUsuario } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUsuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
});

type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export default function UsuariosPage() {
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
      <Box sx={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <h2>Usuários Administrativos</h2>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Novo Usuário
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Novo Usuário Administrativo</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Email" {...register('email')} fullWidth type="email" />
              <TextField label="Senha" {...register('senha')} fullWidth type="password" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isPending}>
              {isPending ? <CircularProgress size={24} /> : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
