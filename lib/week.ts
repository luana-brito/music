export function startOfIsoWeek(value: Date) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function isCurrentIsoWeek(value?: Date | string | null) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return startOfIsoWeek(date).getTime() === startOfIsoWeek(new Date()).getTime();
}

export function weekPlays(musica: { playsWeek?: number | null; playsWeekAt?: Date | string | null }) {
  return isCurrentIsoWeek(musica.playsWeekAt) ? musica.playsWeek || 0 : 0;
}
