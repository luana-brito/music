export function getCapaUrl(musica: {
  capa?: string | null;
  nome?: string;
  tribo?: { logo?: string | null } | null;
}) {
  return musica.capa || musica.tribo?.logo || null;
}
