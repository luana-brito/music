'use client';

import React from 'react';
import { Box, Stack, Card, CardContent, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GroupIcon from '@mui/icons-material/Group';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useMusicas, useTribos } from '@/hooks/useApi';

export default function AdminPage() {
  const { data: musicas, isLoading: musicasLoading } = useMusicas();
  const { data: tribos, isLoading: tribosLoading } = useTribos();

  const totalMusicas = musicas?.length || 0;
  const totalTribos = tribos?.length || 0;
  const totalYears = musicas ? new Set(musicas.map((m) => m.ano)).size : 0;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card sx={{ background: 'rgba(25,118,210,0.1)', border: '1px solid rgba(25,118,210,0.3)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, opacity: 0.3 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <Box sx={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          Dashboard
        </Typography>

        {musicasLoading || tribosLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={4}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Total de Músicas"
                  value={totalMusicas}
                  icon={MusicNoteIcon}
                  color="#1976d2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Total de Tribos"
                  value={totalTribos}
                  icon={GroupIcon}
                  color="#4caf50"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Anos Catalogados"
                  value={totalYears}
                  icon={CalendarMonthIcon}
                  color="#ff9800"
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Últimas Músicas Adicionadas
              </Typography>
              <Stack spacing={1}>
                {musicas
                  ?.slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((musica) => (
                    <Card key={musica.id} sx={{ background: 'rgba(255,255,255,0.05)', p: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {musica.nome}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        {musica.tribo?.nome} • {musica.ano}
                      </Typography>
                    </Card>
                  ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>
    </AdminLayout>
  );
}
