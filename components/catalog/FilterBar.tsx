'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import { CatalogSort, SORT_OPTIONS } from '@/lib/catalog';
import { MUTED } from '@/lib/theme';

interface FilterBarProps {
  years: number[];
  tribos: Array<{ id: string; nome: string }>;
  selectedYear: number | null;
  selectedTribo: string | null;
  sort: CatalogSort;
  hasFilters: boolean;
  onYear: (year: number | null) => void;
  onTribo: (triboId: string | null) => void;
  onSort: (sort: CatalogSort) => void;
  onClear: () => void;
  defaultExpanded?: boolean;
}

export function FilterBar({
  years,
  tribos,
  selectedYear,
  selectedTribo,
  sort,
  hasFilters,
  onYear,
  onTribo,
  onSort,
  onClear,
  defaultExpanded = false,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const activeCount = [selectedYear, selectedTribo, sort !== 'plays' ? sort : null].filter(Boolean).length;

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pb: 1 }}>
      <Accordion
        expanded={expanded}
        onChange={(_, next) => setExpanded(next)}
        disableGutters
        sx={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px !important',
          '&::before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: MUTED }} />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TuneIcon sx={{ fontSize: 18, color: MUTED }} />
            <Box sx={{ fontWeight: 700, fontSize: 14 }}>
              Filtros{activeCount > 0 ? ` · ${activeCount}` : ''}
            </Box>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Ordenar</InputLabel>
              <Select
                label="Ordenar"
                value={sort}
                onChange={(event) => onSort(event.target.value as CatalogSort)}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Ano</InputLabel>
              <Select
                label="Ano"
                value={selectedYear ?? ''}
                onChange={(event) => onYear(event.target.value === '' ? null : Number(event.target.value))}
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
                onChange={(event) => onTribo(event.target.value === '' ? null : String(event.target.value))}
              >
                <MenuItem value="">Todas</MenuItem>
                {tribos.map((tribo) => (
                  <MenuItem key={tribo.id} value={tribo.id}>
                    {tribo.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {hasFilters && (
            <Button onClick={onClear} size="small" sx={{ mt: 1.5 }}>
              Limpar filtros
            </Button>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
