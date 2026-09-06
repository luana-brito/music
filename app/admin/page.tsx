'use client';

import React from 'react';
import { Box, Stack, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import GroupIcon from '@mui/icons-material/Group';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { PURPLE, GREEN, SURFACE, displayTitle, monoLabel } from '@/lib/theme';

export default function DashboardPage() {
  const { data: musicas, isLoading: musicasLoading } = useMusicas();
  const { data: tribos, isLoading: tribosLoading } = useTribos();

  const totalMusicas = musicas?.length || 0;
  const totalTribos = tribos?.length || 0;
  const totalYears = musicas ? new Set(musicas.map((m) => m.ano)).size : 0;

  const StatCard = ({ title, value, icon: Icon, color, accent }: { title: string; value: number; icon: typeof MusicNoteIcon; color: string; accent: string }) => (
    <Card sx={{ background: SURFACE, border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${accent}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ ...monoLabel, color: 'text.secondary', mb: 1 }}>
              {title}
            </Typography>
            <Typography sx={{ ...displayTitle, fontSize: 40, lineHeight: 1, color }}>
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
      <AdminPage title="Dashboard">
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
                  color={PURPLE}
                  accent={PURPLE}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Total de Tribos"
                  value={totalTribos}
                  icon={GroupIcon}
                  color={GREEN}
                  accent={GREEN}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <StatCard
                  title="Anos Catalogados"
                  value={totalYears}
                  icon={CalendarMonthIcon}
                  color="#3B82F6"
                  accent="#3B82F6"
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
                        {musica.tribo?.nome} • {musica.ano} • {musica.plays || 0} plays
                      </Typography>
                    </Card>
                  ))}
              </Stack>
            </Box>
          </Stack>
        )}
      </AdminPage>
    </AdminLayout>
  );
}
