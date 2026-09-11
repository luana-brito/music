'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { CoverArt } from '@/components/ui/CoverArt';
import { useMusicas, useTribos } from '@/hooks/useApi';
import { filterMusicas, uniqueYears } from '@/lib/catalog';
import { formatDuration } from '@/lib/format';
import { getCapaUrl } from '@/lib/capa';
import { MUTED, SURFACE } from '@/lib/theme';

export default function ExportarMusicasPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: musicas, isLoading } = useMusicas();
  const { data: tribos } = useTribos();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTribo, setSelectedTribo] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const years = useMemo(() => uniqueYears(musicas || []), [musicas]);
  const filtered = useMemo(
    () =>
      filterMusicas(musicas || [], {
        query: searchQuery,
        year: selectedYear,
        triboId: selectedTribo,
      }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [musicas, searchQuery, selectedYear, selectedTribo]
  );

  const hasFilters = Boolean(searchQuery.trim() || selectedYear || selectedTribo);
  const total = musicas?.length || 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedYear(null);
    setSelectedTribo(null);
  };

  const downloadZip = async () => {
    if (!filtered.length || downloading) return;
    setError('');
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedYear) params.set('ano', String(selectedYear));
      if (selectedTribo) params.set('triboId', selectedTribo);

      const response = await fetch(`/api/musicas/export?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Não foi possível gerar o ZIP');
      }

      const blob = await response.blob();
      const header = response.headers.get('Content-Disposition') || '';
      const match = header.match(/filename="([^"]+)"/);
      const filename = match?.[1] || 'hype-musicas.zip';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o ZIP');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage
        title="Baixar ZIP"
        action={
          <Button
            variant="contained"
            color="secondary"
            startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <FolderZipIcon />}
            onClick={downloadZip}
            disabled={!filtered.length || downloading}
            sx={{ flexShrink: 0 }}
          >
            {hasFilters ? `Baixar ${filtered.length} faixa(s)` : 'Baixar todas'}
          </Button>
        }
      >
        <Stack spacing={2.5}>
          <Card sx={{ background: SURFACE, border: '1px solid var(--border-subtle)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: MUTED, mb: 2.5 }}>
                Gere um arquivo ZIP com os áudios do catálogo. Use os filtros para baixar só as faixas correspondentes,
                ou deixe tudo em branco para baixar todas.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Buscar"
                  placeholder="Nome, tribo ou ano"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  size="small"
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Ano</InputLabel>
                  <Select
                    label="Ano"
                    value={selectedYear ?? ''}
                    onChange={(event) =>
                      setSelectedYear(event.target.value === '' ? null : Number(event.target.value))
                    }
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tribo</InputLabel>
                  <Select
                    label="Tribo"
                    value={selectedTribo ?? ''}
                    onChange={(event) =>
                      setSelectedTribo(event.target.value === '' ? null : String(event.target.value))
                    }
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {(tribos || []).map((tribo) => (
                      <MenuItem key={tribo.id} value={tribo.id}>
                        {tribo.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              {hasFilters && (
                <Button onClick={clearFilters} size="small" sx={{ mt: 1.5 }}>
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {downloading && (
            <Box>
              <LinearProgress color="secondary" />
              <Typography variant="caption" sx={{ color: MUTED, display: 'block', mt: 1 }}>
                Montando o ZIP… isso pode levar alguns minutos se houver muitas faixas.
              </Typography>
            </Box>
          )}

          <Typography sx={{ color: MUTED, fontWeight: 600 }}>
            {isLoading
              ? 'Carregando catálogo…'
              : `${filtered.length} de ${total} música(s) correspondente(s)`}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : !filtered.length ? (
            <Alert severity="info">Nenhuma música corresponde aos filtros.</Alert>
          ) : isMobile ? (
            <Stack spacing={1}>
              {filtered.map((musica) => (
                <Box
                  key={musica.id}
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
                  <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={48} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {musica.nome}
                    </Box>
                    <Box sx={{ color: MUTED, fontSize: 12 }}>
                      {musica.tribo?.nome} • {musica.ano} • {formatDuration(musica.duracao)}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Box sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Capa</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Ano</TableCell>
                    <TableCell>Tribo</TableCell>
                    <TableCell>Duração</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((musica) => (
                    <TableRow key={musica.id}>
                      <TableCell>
                        <CoverArt name={musica.nome} color={musica.tribo?.cor} src={getCapaUrl(musica)} size={40} />
                      </TableCell>
                      <TableCell>{musica.nome}</TableCell>
                      <TableCell>{musica.ano}</TableCell>
                      <TableCell>{musica.tribo?.nome}</TableCell>
                      <TableCell>{formatDuration(musica.duracao)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Typography variant="caption" sx={{ color: MUTED }}>
            Os áudios entram no ZIP em pastas por tribo, no formato Ano - Nome.
          </Typography>
        </Stack>
      </AdminPage>
    </AdminLayout>
  );
}
