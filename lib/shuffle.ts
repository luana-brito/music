export function shuffledIds(ids: string[], firstId?: string | null) {
  const rest = ids.filter((id) => id !== firstId);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return firstId && ids.includes(firstId) ? [firstId, ...rest] : rest;
}
