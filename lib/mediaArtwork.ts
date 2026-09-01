export function absoluteMediaUrl(path?: string | null) {
  if (typeof window === 'undefined') return '';
  if (!path) return `${window.location.origin}/icon/512`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function mediaSessionArtwork(path?: string | null) {
  const src = absoluteMediaUrl(path);
  if (!src) return [];
  const type = src.includes('.png') || src.includes('/icon/') ? 'image/png' : src.includes('.webp') ? 'image/webp' : 'image/jpeg';
  return [96, 128, 192, 256, 384, 512].map((size) => ({
    src,
    sizes: `${size}x${size}`,
    type,
  }));
}
