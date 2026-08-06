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
  setCurrentTime: (time: number) => void;
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
    currentTime: 0,
    volume: 1,
    repeatMode: 'none',
    isShuffle: false,
  });

  const [offlineMusicas, setOfflineMusicas] = useState<Set<string>>(new Set());

  const openDb = useCallback(() => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('BibliotecaMusical', 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('musicas')) {
          db.createObjectStore('musicas', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        if (db.objectStoreNames.contains('musicas')) {
          resolve(db);
          return;
        }

        // Repair legacy DBs created without the required object store.
        const nextVersion = db.version + 1;
        db.close();

        const repairRequest = indexedDB.open('BibliotecaMusical', nextVersion);
        repairRequest.onupgradeneeded = () => {
          const repairDb = repairRequest.result;
          if (!repairDb.objectStoreNames.contains('musicas')) {
            repairDb.createObjectStore('musicas', { keyPath: 'id' });
          }
        };
        repairRequest.onsuccess = () => resolve(repairRequest.result);
        repairRequest.onerror = () => reject(repairRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }, []);

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
      isPlaying: Boolean(playlist[startIndex]),
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

      if (prev.isShuffle && prev.playlist.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * prev.playlist.length);
        }

        return {
          ...prev,
          currentTrack: prev.playlist[randomIndex],
          currentTime: 0,
          isPlaying: true,
        };
      }

      let nextIndex = currentIndex + 1;

      if (nextIndex >= prev.playlist.length) {
        if (prev.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return {
            ...prev,
            isPlaying: false,
          };
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

  const setCurrentTime = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
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
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.put({ id: musica.id, blob, metadata: musica });
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
  }, [openDb]);

  const removeOffline = useCallback(async (musicaId: string) => {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readwrite');
        const store = tx.objectStore('musicas');
        store.delete(musicaId);
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
  }, [openDb]);

  const isOffline = useCallback((musicaId: string) => {
    return offlineMusicas.has(musicaId);
  }, [offlineMusicas]);

  const getOfflineAudioUrl = useCallback(async (musicaId: string) => {
    try {
      const db = await openDb();
      const record = await new Promise<{ id: string; blob: Blob; metadata: Musica } | undefined>((resolve, reject) => {
        const tx = db.transaction('musicas', 'readonly');
        const store = tx.objectStore('musicas');
        const request = store.get(musicaId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!record?.blob) return null;
      return URL.createObjectURL(record.blob);
    } catch (error) {
      console.error('Erro ao resolver áudio offline:', error);
      return null;
    }
  }, [openDb]);

  return (
    <PlayerContext.Provider value={{ state, play, pause, resume, next, prev, seek, setCurrentTime, setVolume, toggleRepeat, toggleShuffle, downloadOffline, removeOffline, isOffline, getOfflineAudioUrl, audioRef }}>
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
