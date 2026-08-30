'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Musica, PlayerState, PlaylistItem } from '@/types';
import { openOfflineDb } from '@/lib/offlineDb';

interface PlayerContextType {
  state: PlayerState;
  play: (playlist: PlaylistItem[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  downloadOffline: (musica: Musica) => Promise<void>;
  removeOffline: (musicaId: string) => Promise<void>;
  isOffline: (musicaId: string) => boolean;
  getOfflineAudioUrl: (musicaId: string) => Promise<string | null>;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    volume: 1,
    repeatMode: 'none',
    isShuffle: false,
  });
  const [offlineMusicas, setOfflineMusicas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('offlineMusicas');
    if (stored) {
      try {
        setOfflineMusicas(new Set(JSON.parse(stored)));
      } catch {
        localStorage.removeItem('offlineMusicas');
      }
    }
  }, []);

  const play = useCallback((playlist: PlaylistItem[], startIndex = 0) => {
    setState((prev) => ({
      ...prev,
      playlist,
      currentTrack: playlist[startIndex] || null,
      isPlaying: Boolean(playlist[startIndex]),
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTrack || prev.playlist.length === 0) return prev;
      const currentIndex = prev.playlist.findIndex((item) => item.musica.id === prev.currentTrack?.musica.id);

      if (prev.isShuffle && prev.playlist.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * prev.playlist.length);
        }
        return { ...prev, currentTrack: prev.playlist[randomIndex], isPlaying: true };
      }

      let nextIndex = currentIndex + 1;
      if (nextIndex >= prev.playlist.length) {
        if (prev.repeatMode === 'all') nextIndex = 0;
        else return { ...prev, isPlaying: false };
      }

      return { ...prev, currentTrack: prev.playlist[nextIndex], isPlaying: true };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prevState) => {
      if (!prevState.currentTrack || prevState.playlist.length === 0) return prevState;
      const currentIndex = prevState.playlist.findIndex(
        (item) => item.musica.id === prevState.currentTrack?.musica.id
      );
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) return prevState;
      return { ...prevState, currentTrack: prevState.playlist[prevIndex], isPlaying: true };
    });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume }));
    if (audioRef.current) audioRef.current.volume = volume;
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
      const nextMode = modes[(modes.indexOf(prev.repeatMode) + 1) % modes.length];
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const downloadOffline = useCallback(async (musica: Musica) => {
    try {
      const response = await fetch(musica.blobUrl);
      const blob = await response.blob();
      const db = await openOfflineDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readwrite');
        tx.objectStore('musicas').put({ id: musica.id, blob, metadata: musica });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      setOfflineMusicas((prev) => {
        const updated = new Set(prev);
        updated.add(musica.id);
        localStorage.setItem('offlineMusicas', JSON.stringify([...updated]));
        return updated;
      });
    } catch (error) {
      console.error('Erro ao baixar música:', error);
    }
  }, []);

  const removeOffline = useCallback(async (musicaId: string) => {
    try {
      const db = await openOfflineDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readwrite');
        tx.objectStore('musicas').delete(musicaId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      setOfflineMusicas((prev) => {
        const updated = new Set(prev);
        updated.delete(musicaId);
        localStorage.setItem('offlineMusicas', JSON.stringify([...updated]));
        return updated;
      });
    } catch (error) {
      console.error('Erro ao remover música offline:', error);
    }
  }, []);

  const isOffline = useCallback((musicaId: string) => offlineMusicas.has(musicaId), [offlineMusicas]);

  const getOfflineAudioUrl = useCallback(async (musicaId: string) => {
    try {
      const db = await openOfflineDb();
      const record = await new Promise<{ blob: Blob } | undefined>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readonly');
        const request = tx.objectStore('musicas').get(musicaId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (!record?.blob) return null;
      return URL.createObjectURL(record.blob);
    } catch (error) {
      console.error('Erro ao resolver áudio offline:', error);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      play,
      pause,
      resume,
      next,
      prev,
      seek,
      setVolume,
      toggleRepeat,
      toggleShuffle,
      downloadOffline,
      removeOffline,
      isOffline,
      getOfflineAudioUrl,
      audioRef,
    }),
    [
      state,
      play,
      pause,
      resume,
      next,
      prev,
      seek,
      setVolume,
      toggleRepeat,
      toggleShuffle,
      downloadOffline,
      removeOffline,
      isOffline,
      getOfflineAudioUrl,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} playsInline preload="auto" style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer deve ser usado dentro de PlayerProvider');
  }
  return context;
}
