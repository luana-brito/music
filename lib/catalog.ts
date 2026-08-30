import { Musica } from '@/types';

export type CatalogSort = 'plays' | 'name' | 'year' | 'recent';

export const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: 'plays', label: 'Mais ouvidas' },
  { value: 'name', label: 'A–Z' },
  { value: 'year', label: 'Ano' },
  { value: 'recent', label: 'Recentes' },
];

export function matchesQuery(musica: Musica, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    musica.nome.toLowerCase().includes(q) ||
    (musica.tribo?.nome || '').toLowerCase().includes(q) ||
    String(musica.ano).includes(q)
  );
}

export function filterMusicas(
  musicas: Musica[],
  { query, year, triboId }: { query: string; year: number | null; triboId: string | null }
) {
  return musicas.filter(
    (musica) =>
      matchesQuery(musica, query) &&
      (!year || musica.ano === year) &&
      (!triboId || musica.triboId === triboId)
  );
}

export function sortMusicas(musicas: Musica[], sort: CatalogSort) {
  const list = [...musicas];
  switch (sort) {
    case 'name':
      return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'year':
      return list.sort((a, b) => b.ano - a.ano || a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'recent':
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'plays':
    default:
      return list.sort(
        (a, b) => (b.plays || 0) - (a.plays || 0) || a.nome.localeCompare(b.nome, 'pt-BR')
      );
  }
}

export function uniqueYears(musicas: Musica[]) {
  return [...new Set(musicas.map((musica) => musica.ano))].sort((a, b) => b - a);
}

export function musicasByTribo(musicas: Musica[], triboId: string, year?: number | null) {
  return sortMusicas(
    musicas.filter((musica) => musica.triboId === triboId && (!year || musica.ano === year)),
    'plays'
  );
}

export function tribosWithYearMusicas(musicas: Musica[], triboIds: string[], year: number) {
  return triboIds.filter((triboId) => musicas.some((musica) => musica.triboId === triboId && musica.ano === year));
}
