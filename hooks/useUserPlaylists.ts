'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  UserPlaylist,
  addMusicaToPlaylist,
  addMusicasToPlaylist,
  createUserPlaylist,
  deleteUserPlaylist,
  loadUserPlaylists,
  removeMusicaFromPlaylist,
  subscribeUserPlaylists,
  updateUserPlaylist,
} from '@/lib/userPlaylists';

export function useUserPlaylists() {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setPlaylists(loadUserPlaylists());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    return subscribeUserPlaylists(refresh);
  }, [refresh]);

  const create = useCallback((nome: string, musicaIds: string[] = []) => {
    const created = createUserPlaylist(nome, musicaIds);
    refresh();
    return created;
  }, [refresh]);

  const rename = useCallback((id: string, nome: string) => {
    updateUserPlaylist(id, { nome });
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteUserPlaylist(id);
    refresh();
  }, [refresh]);

  const addTrack = useCallback((playlistId: string, musicaId: string) => {
    addMusicaToPlaylist(playlistId, musicaId);
    refresh();
  }, [refresh]);

  const addTracks = useCallback((playlistId: string, musicaIds: string[]) => {
    addMusicasToPlaylist(playlistId, musicaIds);
    refresh();
  }, [refresh]);

  const removeTrack = useCallback((playlistId: string, musicaId: string) => {
    removeMusicaFromPlaylist(playlistId, musicaId);
    refresh();
  }, [refresh]);

  return { playlists, ready, refresh, create, rename, remove, addTrack, addTracks, removeTrack };
}
