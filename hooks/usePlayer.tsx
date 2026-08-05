'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { PlayerState, PlaylistItem, Musica } from '@/types';

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
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    playlist: [],
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    repeatMode: 'none',
    isShuffle: false,
  });

  const [offlineMusicas, setOfflineMusicas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadOfflineData = async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('offlineMusicas');
        if (stored) {
          setOfflineMusicas(new Set(JSON.parse(stored)));
        }
      }
    };
    loadOfflineData();
  }, []);

  const play = useCallback((playlist: PlaylistItem[], startIndex = 0) => {
    setState((prev) => ({
      ...prev,
      playlist,
      currentTrack: playlist[startIndex] || null,
      isPlaying: false,
      currentTime: 0,
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
      const currentIndex = prev.playlist.indexOf(prev.currentTrack);
      let nextIndex = currentIndex + 1;

      if (nextIndex >= prev.playlist.length) {
        if (prev.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return prev;
        }
      }

      return {
        ...prev,
        currentTrack: prev.playlist[nextIndex],
        currentTime: 0,
        isPlaying: true,
      };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTrack || prev.playlist.length === 0) return prev;
      const currentIndex = prev.playlist.indexOf(prev.currentTrack);
      const prevIndex = currentIndex - 1;

      if (prevIndex < 0) return prev;

      return {
        ...prev,
        currentTrack: prev.playlist[prevIndex],
        currentTime: 0,
        isPlaying: true,
      };
    });
  }, []);

  const seek = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume }));
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
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
      const dbRequest = indexedDB.open('BibliotecaMusical', 1);

      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.put({ id: musica.id, blob, metadata: musica });

        setOfflineMusicas((prev) => {
          const updated = new Set(prev);
          updated.add(musica.id);
          localStorage.setItem('offlineMusicas', JSON.stringify([...updated]));
          return updated;
        });
      };
    } catch (error) {
      console.error('Erro ao baixar música:', error);
    }
  }, []);

  const removeOffline = useCallback(async (musicaId: string) => {
    try {
      const dbRequest = indexedDB.open('BibliotecaMusical', 1);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.delete(musicaId);

        setOfflineMusicas((prev) => {
          const updated = new Set(prev);
          updated.delete(musicaId);
          localStorage.setItem('offlineMusicas', JSON.stringify([...updated]));
          return updated;
        });
      };
    } catch (error) {
      console.error('Erro ao remover música offline:', error);
    }
  }, []);

  const isOffline = useCallback((musicaId: string) => {
    return offlineMusicas.has(musicaId);
  }, [offlineMusicas]);

  return (
    <PlayerContext.Provider value={{ state, play, pause, resume, next, prev, seek, setVolume, toggleRepeat, toggleShuffle, downloadOffline, removeOffline, isOffline, audioRef }}>
      {children}
      <audio ref={audioRef} controls style={{ display: 'none' }} />
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
