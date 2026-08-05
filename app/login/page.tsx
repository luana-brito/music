'use client';

import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@igreja.com');
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        senha,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/admin');
      } else {
        setError('Email ou senha inválidos.');
      }
    } catch (err) {
      setError('Erro na autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%)',
        padding: '16px',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '32px 24px',
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
              🎵
            </Typography>
            <Typography variant="h5">Admin</Typography>
            <Typography variant="subtitle2" sx={{ color: '#999', mt: 1 }}>
              Acesso à área administrativa
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                variant="outlined"
                disabled={loading}
                autoComplete="email"
              />

              <TextField
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                fullWidth
                variant="outlined"
                disabled={loading}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5, fontSize: '16px', fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Entrar'}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" sx={{ textAlign: 'center', color: '#666' }}>
            Email de teste: admin@igreja.com
            <br />
            Senha de teste: 123456
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
