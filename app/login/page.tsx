'use client';

import React, { Suspense, useState } from 'react';
import { Alert, Box, Button, Card, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MUTED, SURFACE } from '@/lib/theme';

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
        background:
          'radial-gradient(110% 80% at 15% 95%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0) 55%), radial-gradient(120% 90% at 90% 5%, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0) 50%), linear-gradient(160deg, #100A18 0%, #08090D 70%)',
        padding: '16px',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          background: SURFACE,
          border: '1px solid var(--border-subtle)',
          padding: { xs: '28px 20px', sm: '40px 28px' },
          borderRadius: 4,
        }}
      >
        <Stack spacing={3}>
          <Button
            onClick={() => router.push('/' as never)}
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: 'flex-start', color: MUTED, px: 0, minWidth: 0 }}
          >
            Voltar ao app
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src="/brand/hype-logo.png"
              alt="Hype"
              sx={{
                height: 96,
                width: 'auto',
                maxWidth: 240,
                objectFit: 'contain',
                filter: 'brightness(0) invert(1) drop-shadow(0 0 10px rgba(139,92,246,0.25))',
                display: 'block',
                mx: 'auto',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
            <Typography variant="subtitle2" sx={{ color: MUTED, mt: 2 }}>
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
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Entrar'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  );
}
