export interface UserPlaylist {
  id: string;
  nome: string;
  musicaIds: string[];
  createdAt: number;
}

const KEY = 'userPlaylists';
const CHANGE_EVENT = 'userPlaylists-changed';

function randomId() {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadUserPlaylists(): UserPlaylist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserPlaylist[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserPlaylists(playlists: UserPlaylist[]) {
  localStorage.setItem(KEY, JSON.stringify(playlists));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function subscribeUserPlaylists(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export function createUserPlaylist(nome: string, musicaIds: string[] = []): UserPlaylist {
  const playlist: UserPlaylist = {
    id: randomId(),
    nome: nome.trim() || 'Minha playlist',
    musicaIds,
    createdAt: Date.now(),
  };
  const all = [playlist, ...loadUserPlaylists()];
  saveUserPlaylists(all);
  return playlist;
}

export function updateUserPlaylist(id: string, patch: Partial<Pick<UserPlaylist, 'nome' | 'musicaIds'>>) {
  const all = loadUserPlaylists().map((playlist) => (playlist.id === id ? { ...playlist, ...patch } : playlist));
  saveUserPlaylists(all);
  return all.find((playlist) => playlist.id === id) || null;
}

export function deleteUserPlaylist(id: string) {
  saveUserPlaylists(loadUserPlaylists().filter((playlist) => playlist.id !== id));
}

export function addMusicaToPlaylist(playlistId: string, musicaId: string) {
  return addMusicasToPlaylist(playlistId, [musicaId]);
}

export function addMusicasToPlaylist(playlistId: string, musicaIds: string[]) {
  const playlist = loadUserPlaylists().find((item) => item.id === playlistId);
  if (!playlist) return null;
  const merged = [...playlist.musicaIds];
  for (const id of musicaIds) {
    if (!merged.includes(id)) merged.push(id);
  }
  return updateUserPlaylist(playlistId, { musicaIds: merged });
}

export function removeMusicaFromPlaylist(playlistId: string, musicaId: string) {
  const playlist = loadUserPlaylists().find((item) => item.id === playlistId);
  if (!playlist) return null;
  return updateUserPlaylist(playlistId, { musicaIds: playlist.musicaIds.filter((id) => id !== musicaId) });
}
