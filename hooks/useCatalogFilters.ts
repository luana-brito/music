'use client';

import { useMemo, useState } from 'react';
import { CatalogSort, filterMusicas, sortMusicas, uniqueYears } from '@/lib/catalog';
import { Musica } from '@/types';

export function useCatalogFilters(musicas: Musica[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTribo, setSelectedTribo] = useState<string | null>(null);
  const [sort, setSort] = useState<CatalogSort>('plays');

  const years = useMemo(() => uniqueYears(musicas || []), [musicas]);

  const filteredMusicas = useMemo(
    () =>
      sortMusicas(
        filterMusicas(musicas || [], {
          query: searchQuery,
          year: selectedYear,
          triboId: selectedTribo,
        }),
        sort
      ),
    [musicas, searchQuery, selectedYear, selectedTribo, sort]
  );

  const hasFilters = Boolean(searchQuery.trim() || selectedYear || selectedTribo);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedYear(null);
    setSelectedTribo(null);
    setSort('plays');
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedYear,
    setSelectedYear,
    selectedTribo,
    setSelectedTribo,
    sort,
    setSort,
    years,
    filteredMusicas,
    hasFilters,
    clearFilters,
  };
}
