'use client';

import React, { Suspense, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { BLACK, ELEVATED, MUTED, ORANGE } from '@/lib/theme';

function safeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/admin';
  }
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        senha,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        router.push(callbackUrl as never);
      } else {
        setError('Email ou senha inválidos.');
      }
    } catch {
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
        background: `radial-gradient(circle at top, rgba(255,107,0,0.18), ${BLACK} 58%)`,
        padding: '16px',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          background: ELEVATED,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: { xs: '28px 20px', sm: '40px 28px' },
          borderRadius: 4,
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${ORANGE}, #9a3a00)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 26,
                color: '#000',
                mb: 1.5,
              }}
            >
              ♪
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Entrar
            </Typography>
            <Typography variant="subtitle2" sx={{ color: MUTED, mt: 1 }}>
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
                required
                variant="outlined"
                disabled={loading}
                autoComplete="username"
                inputProps={{ maxLength: 180 }}
              />

              <TextField
                label="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                fullWidth
                required
                variant="outlined"
                disabled={loading}
                autoComplete="current-password"
                inputProps={{ maxLength: 120 }}
              />

              <Button type="submit" variant="contained" fullWidth disabled={loading || !email || !senha} sx={{ py: 1.4, fontSize: 16 }}>
                {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Entrar'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  );
}
