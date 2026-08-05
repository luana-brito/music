'use client';

import React, { useState } from 'react';
import { Box, Stack, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useTribos, useCreateTribo } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createTriboSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().min(1, 'Cor é obrigatória'),
  logo: z.string().optional(),
});

type CreateTriboInput = z.infer<typeof createTriboSchema>;

export default function TribosPage() {
  const { data: tribos, isLoading } = useTribos();
  const { mutate: createTribo, isPending } = useCreateTribo();
  const [openDialog, setOpenDialog] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateTriboInput>({
    resolver: zodResolver(createTriboSchema),
  });

  const onSubmit = (data: CreateTriboInput) => {
    createTribo(data, {
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
          <h2>Tribos</h2>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Nova Tribo
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
                  <TableCell>Cor</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tribos?.map((tribo) => (
                  <TableRow key={tribo.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>{tribo.nome}</TableCell>
                    <TableCell>
                      <Box sx={{ width: 24, height: 24, background: tribo.cor, borderRadius: 1 }} />
                    </TableCell>
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
          <DialogTitle>Nova Tribo</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField label="Nome" {...register('nome')} fullWidth />
              <TextField label="Cor (hex)" {...register('cor')} fullWidth type="color" />
              <TextField label="Logo URL (opcional)" {...register('logo')} fullWidth />
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
