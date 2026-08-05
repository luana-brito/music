'use client';

import React from 'react';
import { Box, Stack, Typography, Button, Card, CardContent } from '@mui/material';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { signOut } from 'next-auth/react';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <Box sx={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          Configurações
        </Typography>

        <Stack spacing={3}>
          <Card sx={{ background: 'rgba(25,118,210,0.1)', border: '1px solid rgba(25,118,210,0.3)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Segurança
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                Gerencie suas credenciais e permissões de acesso.
              </Typography>
              <Button variant="outlined" size="small">
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(25,118,210,0.1)', border: '1px solid rgba(25,118,210,0.3)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Vercel Blob
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                Configure o token para upload de arquivos.
              </Typography>
              <Button variant="outlined" size="small" disabled>
                Configurar (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(25,118,210,0.1)', border: '1px solid rgba(25,118,210,0.3)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Banco de Dados
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                Informações sobre a conexão e estado do banco.
              </Typography>
              <Button variant="outlined" size="small" disabled>
                Verificar (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, color: '#ef5350' }}>
                Sair
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 2 }}>
                Encerrar sua sessão de administrador.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
              >
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </AdminLayout>
  );
}
