'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Musica, PlayerState, PlaylistItem } from '@/types';
import { openOfflineDb } from '@/lib/offlineDb';
import { getCapaUrl } from '@/lib/capa';
import { shuffledIds } from '@/lib/shuffle';
import { mediaSessionArtwork } from '@/lib/mediaArtwork';

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
  const loadedTrackId = useRef<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    playlist: [],
    shuffleQueue: [],
    isPlaying: false,
    volume: 1,
    repeatMode: 'none',
    isShuffle: false,
  });
  const [offlineMusicas, setOfflineMusicas] = useState<Set<string>>(new Set());
  const offlineMusicasRef = useRef(offlineMusicas);
  const currentTrackRef = useRef(state.currentTrack);
  offlineMusicasRef.current = offlineMusicas;
  currentTrackRef.current = state.currentTrack;

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
    const current = playlist[startIndex] || null;
    isPlayingRef.current = Boolean(current);
    setState((prev) => ({
      ...prev,
      playlist,
      currentTrack: current,
      isPlaying: Boolean(current),
      shuffleQueue: prev.isShuffle
        ? shuffledIds(playlist.map((item) => item.musica.id), current?.musica.id)
        : [],
    }));
  }, []);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    isPlayingRef.current = true;
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTrack || prev.playlist.length === 0) return prev;
      const ids = prev.playlist.map((item) => item.musica.id);
      const currentId = prev.currentTrack.musica.id;
      const byId = (id: string) => prev.playlist.find((item) => item.musica.id === id) || prev.currentTrack;

      if (prev.isShuffle && prev.playlist.length > 1) {
        const queue = prev.shuffleQueue.length === ids.length ? prev.shuffleQueue : shuffledIds(ids, currentId);
        const index = queue.indexOf(currentId);
        if (index >= 0 && index < queue.length - 1) {
          isPlayingRef.current = true;
          return { ...prev, shuffleQueue: queue, currentTrack: byId(queue[index + 1]), isPlaying: true };
        }
        if (prev.repeatMode === 'all') {
          const reshuffled = shuffledIds(ids.filter((id) => id !== currentId));
          if (!reshuffled.length) return prev;
          isPlayingRef.current = true;
          return {
            ...prev,
            shuffleQueue: [currentId, ...reshuffled],
            currentTrack: byId(reshuffled[0]),
            isPlaying: true,
          };
        }
        isPlayingRef.current = false;
        return { ...prev, shuffleQueue: queue, isPlaying: false };
      }

      const currentIndex = prev.playlist.findIndex((item) => item.musica.id === currentId);
      let nextIndex = currentIndex + 1;
      if (nextIndex >= prev.playlist.length) {
        if (prev.repeatMode === 'all') nextIndex = 0;
        else {
          isPlayingRef.current = false;
          return { ...prev, isPlaying: false };
        }
      }
      isPlayingRef.current = true;
      return { ...prev, currentTrack: prev.playlist[nextIndex], isPlaying: true };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prevState) => {
      if (!prevState.currentTrack || prevState.playlist.length === 0) return prevState;
      const currentId = prevState.currentTrack.musica.id;
      const byId = (id: string) => prevState.playlist.find((item) => item.musica.id === id) || prevState.currentTrack;

      if (prevState.isShuffle && prevState.shuffleQueue.length > 1) {
        const index = prevState.shuffleQueue.indexOf(currentId);
        if (index <= 0) return prevState;
        isPlayingRef.current = true;
        return { ...prevState, currentTrack: byId(prevState.shuffleQueue[index - 1]), isPlaying: true };
      }

      const currentIndex = prevState.playlist.findIndex((item) => item.musica.id === currentId);
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) return prevState;
      isPlayingRef.current = true;
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
    setState((prev) => {
      const isShuffle = !prev.isShuffle;
      const currentId = prev.currentTrack?.musica.id;
      return {
        ...prev,
        isShuffle,
        shuffleQueue: isShuffle
          ? shuffledIds(prev.playlist.map((item) => item.musica.id), currentId)
          : [],
      };
    });
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x-webkit-airplay', 'allow');
  }, []);

  const trackId = state.currentTrack?.musica.id ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = currentTrackRef.current;
    if (!track) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      loadedTrackId.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      return;
    }

    if (loadedTrackId.current === track.musica.id && audio.src) return;

    let cancelled = false;
    const musica = track.musica;
    const shouldUseOffline = Boolean(track.isOffline || offlineMusicasRef.current.has(musica.id));

    const loadSource = async () => {
      let src = musica.blobUrl;
      if (shouldUseOffline) {
        const offlineUrl = await getOfflineAudioUrl(musica.id);
        if (cancelled) {
          if (offlineUrl) URL.revokeObjectURL(offlineUrl);
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = offlineUrl;
        src = offlineUrl || musica.blobUrl;
      } else if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      if (cancelled) return;
      audio.src = src;
      loadedTrackId.current = musica.id;
      audio.currentTime = 0;
      if (isPlayingRef.current) audio.play().catch(() => {});
    };

    loadSource();
    return () => {
      cancelled = true;
    };
  }, [trackId, getOfflineAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackId) return;
    if (loadedTrackId.current !== trackId) return;
    if (state.isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [state.isPlaying, trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const keepPlaying = () => {
      if (!isPlayingRef.current) return;
      window.setTimeout(() => {
        if (isPlayingRef.current && audio.paused) audio.play().catch(() => {});
      }, 0);
    };
    audio.addEventListener('pause', keepPlaying);
    return () => audio.removeEventListener('pause', keepPlaying);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      const audio = audioRef.current;
      if (document.visibilityState !== 'visible' || !state.isPlaying || !audio) return;
      if (audio.paused) audio.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [state.isPlaying]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const audio = audioRef.current;

    const bind = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* ação não suportada no navegador */
      }
    };

    bind('play', () => {
      isPlayingRef.current = true;
      setState((prev) => ({ ...prev, isPlaying: true }));
      audioRef.current?.play().catch(() => {});
    });
    bind('pause', () => {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
      audioRef.current?.pause();
    });
    bind('stop', () => {
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    });
    bind('previoustrack', () => prev());
    bind('nexttrack', () => next());
    bind('seekbackward', (details) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - (details.seekOffset || 10));
    });
    bind('seekforward', (details) => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + (details.seekOffset || 10)
      );
    });
    bind('seekto', (details) => {
      if (details.seekTime == null || !audioRef.current) return;
      audioRef.current.currentTime = details.seekTime;
    });

    const updatePosition = () => {
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch {
        /* older browsers */
      }
    };
    audio?.addEventListener('timeupdate', updatePosition);
    audio?.addEventListener('loadedmetadata', updatePosition);
    audio?.addEventListener('durationchange', updatePosition);
    return () => {
      audio?.removeEventListener('timeupdate', updatePosition);
      audio?.removeEventListener('loadedmetadata', updatePosition);
      audio?.removeEventListener('durationchange', updatePosition);
    };
  }, [next, prev, state.currentTrack?.musica.id]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const track = state.currentTrack?.musica;
    if (!track) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.nome,
      artist: track.tribo?.nome || 'Música',
      album: track.ano ? String(track.ano) : 'Música',
      artwork: mediaSessionArtwork(getCapaUrl(track)),
    });
    navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
  }, [
    state.currentTrack?.musica.id,
    state.currentTrack?.musica.nome,
    state.currentTrack?.musica.tribo?.nome,
    state.currentTrack?.musica.capa,
    state.currentTrack?.musica.ano,
    state.isPlaying,
  ]);

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
      <audio
        ref={audioRef}
        id="app-audio-player"
        playsInline
        preload="auto"
        controls={false}
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
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
