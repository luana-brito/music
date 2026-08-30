export const APP_NAV = [
  { label: 'Início', href: '/', value: 'home' },
  { label: 'Downloads', href: '/downloads', value: 'downloads' },
  { label: 'Biblioteca', href: '/biblioteca', value: 'biblioteca' },
  { label: 'Playlists', href: '/playlists', value: 'playlists' },
] as const;

export function navValueFromPath(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/downloads')) return 'downloads';
  if (pathname.startsWith('/biblioteca')) return 'biblioteca';
  if (pathname.startsWith('/playlists')) return 'playlists';
  return 'home';
}
