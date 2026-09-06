'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Musica, PlayerState, PlaylistItem } from '@/types';
import { openOfflineDb } from '@/lib/offlineDb';
import { getCapaUrl } from '@/lib/capa';
import { shuffledIds } from '@/lib/shuffle';
import { mediaSessionArtwork } from '@/lib/mediaArtwork';
import { APP_NAME } from '@/lib/appInfo';

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

const PREV_RESTART_SECONDS = 3;

type AudioSessionNavigator = Navigator & {
  audioSession?: {
    type: string;
    state?: string;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
};

function itemById(playlist: PlaylistItem[], id: string, fallback: PlaylistItem | null) {
  return playlist.find((item) => item.musica.id === id) || fallback;
}

function getNextPlayback(state: PlayerState): { currentTrack: PlaylistItem; shuffleQueue?: string[] } | null {
  if (!state.currentTrack || state.playlist.length === 0) return null;
  const ids = state.playlist.map((item) => item.musica.id);
  const currentId = state.currentTrack.musica.id;
  const byId = (id: string) => itemById(state.playlist, id, state.currentTrack);

  if (state.isShuffle && state.playlist.length > 1) {
    const queue = state.shuffleQueue.length === ids.length ? state.shuffleQueue : shuffledIds(ids, currentId);
    const index = queue.indexOf(currentId);
    if (index >= 0 && index < queue.length - 1) {
      const track = byId(queue[index + 1]);
      return track ? { currentTrack: track, shuffleQueue: queue } : null;
    }
    if (state.repeatMode === 'all') {
      const reshuffled = shuffledIds(ids.filter((id) => id !== currentId));
      if (!reshuffled.length) return null;
      const track = byId(reshuffled[0]);
      return track ? { currentTrack: track, shuffleQueue: [currentId, ...reshuffled] } : null;
    }
    return null;
  }

  const currentIndex = state.playlist.findIndex((item) => item.musica.id === currentId);
  let nextIndex = currentIndex + 1;
  if (nextIndex >= state.playlist.length) {
    if (state.repeatMode === 'all') nextIndex = 0;
    else return null;
  }
  return { currentTrack: state.playlist[nextIndex] };
}

function getPrevPlayback(state: PlayerState): { currentTrack: PlaylistItem } | null {
  if (!state.currentTrack || state.playlist.length === 0) return null;
  const currentId = state.currentTrack.musica.id;
  const byId = (id: string) => itemById(state.playlist, id, state.currentTrack);

  if (state.isShuffle && state.shuffleQueue.length > 1) {
    const index = state.shuffleQueue.indexOf(currentId);
    if (index <= 0) return null;
    const track = byId(state.shuffleQueue[index - 1]);
    return track ? { currentTrack: track } : null;
  }

  const currentIndex = state.playlist.findIndex((item) => item.musica.id === currentId);
  const prevIndex = currentIndex - 1;
  if (prevIndex < 0) return null;
  return { currentTrack: state.playlist[prevIndex] };
}

function bindMediaAction(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    /* ação não suportada no navegador */
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedTrackId = useRef<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const userPausedRef = useRef(false);
  const interruptedRef = useRef(false);
  const suppressPauseWatchRef = useRef(false);
  const mediaSessionPauseAtRef = useRef(0);
  const loadSeqRef = useRef(0);
  const endingLockRef = useRef(false);
  const endWatchRef = useRef<number | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
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
  const stateRef = useRef(state);
  offlineMusicasRef.current = offlineMusicas;
  currentTrackRef.current = state.currentTrack;
  stateRef.current = state;

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

  const playWhenReady = useCallback((audio: HTMLAudioElement) => {
    try {
      const session = (navigator as AudioSessionNavigator).audioSession;
      if (session) session.type = 'playback';
    } catch {
      /* Safari antigo */
    }
    const tryPlay = () => {
      if (!isPlayingRef.current) return;
      audio.play().catch(() => {
        window.setTimeout(() => {
          if (isPlayingRef.current && audio.paused) audio.play().catch(() => {});
        }, 80);
      });
    };
    tryPlay();
    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      audio.addEventListener('canplay', tryPlay, { once: true });
    }
  }, []);

  const loadTrack = useCallback(
    async (track: PlaylistItem | null, shouldPlay: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      const seq = ++loadSeqRef.current;

      if (!track) {
        suppressPauseWatchRef.current = true;
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

      const alreadyLoaded = loadedTrackId.current === track.musica.id && Boolean(audio.src);
      if (alreadyLoaded) {
        if (shouldPlay) {
          if (audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.25)) {
            audio.currentTime = 0;
          }
          playWhenReady(audio);
        } else {
          suppressPauseWatchRef.current = true;
          audio.pause();
        }
        return;
      }

      const musica = track.musica;
      const shouldUseOffline = Boolean(track.isOffline || offlineMusicasRef.current.has(musica.id));

      const applySrc = (src: string) => {
        if (seq !== loadSeqRef.current) return;
        suppressPauseWatchRef.current = true;
        audio.src = src;
        loadedTrackId.current = musica.id;
        audio.currentTime = 0;
        if (shouldPlay && isPlayingRef.current) playWhenReady(audio);
      };

      if (shouldUseOffline) {
        const offlineUrl = await getOfflineAudioUrl(musica.id);
        if (seq !== loadSeqRef.current) {
          if (offlineUrl) URL.revokeObjectURL(offlineUrl);
          return;
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = offlineUrl;
        applySrc(offlineUrl || musica.blobUrl);
        return;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      applySrc(musica.blobUrl);
    },
    [getOfflineAudioUrl, playWhenReady]
  );

  const play = useCallback(
    (playlist: PlaylistItem[], startIndex = 0) => {
      const current = playlist[startIndex] || null;
      userPausedRef.current = false;
      interruptedRef.current = false;
      endingLockRef.current = false;
      isPlayingRef.current = Boolean(current);
      setState((prev) => ({
        ...prev,
        playlist,
        currentTrack: current,
        isPlaying: Boolean(current),
        shuffleQueue: prev.isShuffle
          ? shuffledIds(
              playlist.map((item) => item.musica.id),
              current?.musica.id
            )
          : [],
      }));
      void loadTrack(current, Boolean(current));
    },
    [loadTrack]
  );

  const pause = useCallback(() => {
    userPausedRef.current = true;
    interruptedRef.current = false;
    isPlayingRef.current = false;
    setState((prev) => ({ ...prev, isPlaying: false }));
    suppressPauseWatchRef.current = true;
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    userPausedRef.current = false;
    interruptedRef.current = false;
    isPlayingRef.current = true;
    setState((prev) => ({ ...prev, isPlaying: true }));
    const audio = audioRef.current;
    if (audio) playWhenReady(audio);
  }, [playWhenReady]);

  const next = useCallback(() => {
    const upcoming = getNextPlayback(stateRef.current);
    if (!upcoming) {
      userPausedRef.current = false;
      interruptedRef.current = false;
      isPlayingRef.current = false;
      endingLockRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
      suppressPauseWatchRef.current = true;
      audioRef.current?.pause();
      return;
    }
    userPausedRef.current = false;
    interruptedRef.current = false;
    endingLockRef.current = false;
    isPlayingRef.current = true;
    currentTrackRef.current = upcoming.currentTrack;
    setState((prev) => ({
      ...prev,
      currentTrack: upcoming.currentTrack,
      shuffleQueue: upcoming.shuffleQueue ?? prev.shuffleQueue,
      isPlaying: true,
    }));
    void loadTrack(upcoming.currentTrack, true);
  }, [loadTrack]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > PREV_RESTART_SECONDS) {
      audio.currentTime = 0;
      if (isPlayingRef.current) playWhenReady(audio);
      return;
    }
    const previous = getPrevPlayback(stateRef.current);
    if (!previous) {
      if (audio) audio.currentTime = 0;
      return;
    }
    userPausedRef.current = false;
    interruptedRef.current = false;
    endingLockRef.current = false;
    isPlayingRef.current = true;
    currentTrackRef.current = previous.currentTrack;
    setState((prevState) => ({
      ...prevState,
      currentTrack: previous.currentTrack,
      isPlaying: true,
    }));
    void loadTrack(previous.currentTrack, true);
  }, [loadTrack, playWhenReady]);

  const handleTrackEnded = useCallback(() => {
    if (endingLockRef.current) return;
    const current = stateRef.current;
    if (current.repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        playWhenReady(audio);
      }
      return;
    }
    endingLockRef.current = true;
    const upcoming = getNextPlayback(current);
    if (!upcoming) {
      userPausedRef.current = false;
      interruptedRef.current = false;
      isPlayingRef.current = false;
      endingLockRef.current = false;
      setState((prevState) => ({ ...prevState, isPlaying: false }));
      return;
    }
    userPausedRef.current = false;
    interruptedRef.current = false;
    isPlayingRef.current = true;
    currentTrackRef.current = upcoming.currentTrack;
    setState((prevState) => ({
      ...prevState,
      currentTrack: upcoming.currentTrack,
      shuffleQueue: upcoming.shuffleQueue ?? prevState.shuffleQueue,
      isPlaying: true,
    }));
    void loadTrack(upcoming.currentTrack, true);
  }, [loadTrack, playWhenReady]);

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
        shuffleQueue: isShuffle ? shuffledIds(prev.playlist.map((item) => item.musica.id), currentId) : [],
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    audio.setAttribute('x-webkit-airplay', 'allow');
  }, []);

  const trackId = state.currentTrack?.musica.id ?? null;

  useEffect(() => {
    void loadTrack(currentTrackRef.current, isPlayingRef.current);
  }, [trackId, loadTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackId) return;
    if (loadedTrackId.current !== trackId) return;
    if (interruptedRef.current) return;
    if (state.isPlaying) playWhenReady(audio);
    else {
      suppressPauseWatchRef.current = true;
      audio.pause();
    }
  }, [state.isPlaying, trackId, playWhenReady]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = state.repeatMode === 'one';
  }, [state.repeatMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const clearEndWatch = () => {
      if (endWatchRef.current != null) {
        window.clearTimeout(endWatchRef.current);
        endWatchRef.current = null;
      }
    };

    const scheduleEndWatch = () => {
      clearEndWatch();
      if (audio.loop || !isPlayingRef.current) return;
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const remainingMs = (audio.duration - audio.currentTime) * 1000;
      if (remainingMs < 0 || remainingMs > 24 * 60 * 60 * 1000) return;
      endWatchRef.current = window.setTimeout(() => {
        if (!isPlayingRef.current || audio.loop) return;
        const atEnd = audio.ended || (audio.duration > 0 && audio.currentTime >= audio.duration - 0.2);
        if (atEnd) handleTrackEnded();
      }, Math.max(40, remainingMs + 60));
    };

    const onEnded = () => handleTrackEnded();
    const onPlaying = () => {
      endingLockRef.current = false;
      interruptedRef.current = false;
      scheduleEndWatch();
    };
    const onPlay = () => {
      interruptedRef.current = false;
      if (!isPlayingRef.current && !userPausedRef.current) {
        isPlayingRef.current = true;
        setState((prev) => ({ ...prev, isPlaying: true }));
      }
    };
    const onPause = () => {
      clearEndWatch();
      if (suppressPauseWatchRef.current) {
        suppressPauseWatchRef.current = false;
        return;
      }
      if (audio.ended || userPausedRef.current || !isPlayingRef.current) return;
      window.setTimeout(() => {
        if (!isPlayingRef.current || userPausedRef.current) return;
        if (Date.now() - mediaSessionPauseAtRef.current < 500) return;
        if (!audio.paused) return;
        audio.play().catch(() => {
          interruptedRef.current = true;
          isPlayingRef.current = false;
          setState((prev) => ({ ...prev, isPlaying: false }));
        });
      }, 180);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('seeked', scheduleEndWatch);
    audio.addEventListener('loadedmetadata', scheduleEndWatch);
    audio.addEventListener('durationchange', scheduleEndWatch);
    return () => {
      clearEndWatch();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('seeked', scheduleEndWatch);
      audio.removeEventListener('loadedmetadata', scheduleEndWatch);
      audio.removeEventListener('durationchange', scheduleEndWatch);
    };
  }, [handleTrackEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onInterruptionBegin = () => {
      if (userPausedRef.current) return;
      if (!isPlayingRef.current && audio.paused) return;
      interruptedRef.current = true;
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const onInterruptionEnd = () => {
      if (userPausedRef.current) return;
      if (!interruptedRef.current) return;
      interruptedRef.current = false;
      isPlayingRef.current = true;
      setState((prev) => ({ ...prev, isPlaying: true }));
      playWhenReady(audio);
    };

    const addRaw = (event: string, handler: EventListener) => {
      audio.addEventListener(event, handler);
    };
    const removeRaw = (event: string, handler: EventListener) => {
      audio.removeEventListener(event, handler);
    };

    addRaw('webkitbegininterruption', onInterruptionBegin);
    addRaw('webkitendinterruption', onInterruptionEnd);

    const audioSession = (navigator as AudioSessionNavigator).audioSession;
    const onSessionChange = () => {
      const sessionState = audioSession?.state;
      if (sessionState === 'interrupted') onInterruptionBegin();
      if (sessionState === 'active' || sessionState === 'running') onInterruptionEnd();
    };
    if (audioSession) {
      try {
        audioSession.type = 'playback';
      } catch {
        /* Safari antigo */
      }
      audioSession.addEventListener('statechange', onSessionChange);
    }

    return () => {
      removeRaw('webkitbegininterruption', onInterruptionBegin);
      removeRaw('webkitendinterruption', onInterruptionEnd);
      audioSession?.removeEventListener('statechange', onSessionChange);
    };
  }, [playWhenReady]);

  useEffect(() => {
    const tryKeepPlaying = () => {
      const audio = audioRef.current;
      if (!audio || userPausedRef.current || interruptedRef.current) return;
      if (!isPlayingRef.current || !audio.paused) return;
      playWhenReady(audio);
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      tryKeepPlaying();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tryKeepPlaying);
    window.addEventListener('pageshow', tryKeepPlaying);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tryKeepPlaying);
      window.removeEventListener('pageshow', tryKeepPlaying);
    };
  }, [playWhenReady]);

  const resumeRef = useRef(resume);
  const nextRef = useRef(next);
  const prevRef = useRef(prev);
  resumeRef.current = resume;
  nextRef.current = next;
  prevRef.current = prev;

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const audio = audioRef.current;

    const onPlay = () => resumeRef.current();
    const onPause = () => {
      mediaSessionPauseAtRef.current = Date.now();
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
      suppressPauseWatchRef.current = true;
      audioRef.current?.pause();
    };
    const onStop = () => {
      userPausedRef.current = true;
      interruptedRef.current = false;
      isPlayingRef.current = false;
      setState((prev) => ({ ...prev, isPlaying: false }));
      suppressPauseWatchRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };

    bindMediaAction('play', onPlay);
    bindMediaAction('pause', onPause);
    bindMediaAction('stop', onStop);
    bindMediaAction('previoustrack', () => prevRef.current());
    bindMediaAction('nexttrack', () => nextRef.current());
    bindMediaAction('seekbackward', null);
    bindMediaAction('seekforward', null);
    bindMediaAction('seekto', (details) => {
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
    audio?.addEventListener('ratechange', updatePosition);
    return () => {
      audio?.removeEventListener('timeupdate', updatePosition);
      audio?.removeEventListener('loadedmetadata', updatePosition);
      audio?.removeEventListener('durationchange', updatePosition);
      audio?.removeEventListener('ratechange', updatePosition);
    };
  }, []);

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
      artist: track.tribo?.nome || APP_NAME,
      album: track.ano ? String(track.ano) : APP_NAME,
      artwork: mediaSessionArtwork(getCapaUrl(track)),
    });
    navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';

    bindMediaAction('previoustrack', () => prevRef.current());
    bindMediaAction('nexttrack', () => nextRef.current());
    bindMediaAction('seekbackward', null);
    bindMediaAction('seekforward', null);
  }, [
    state.currentTrack?.musica.id,
    state.currentTrack?.musica.nome,
    state.currentTrack?.musica.tribo?.nome,
    state.currentTrack?.musica.capa,
    state.currentTrack?.musica.ano,
    state.isPlaying,
  ]);

  useEffect(() => {
    const upcoming = getNextPlayback(stateRef.current);
    const nextUrl = upcoming?.currentTrack.musica.blobUrl;
    if (preloadRef.current) {
      preloadRef.current.removeAttribute('src');
      preloadRef.current.load();
      preloadRef.current = null;
    }
    if (!nextUrl || nextUrl.startsWith('blob:') || state.repeatMode === 'one') return;
    const preloader = new Audio();
    preloader.preload = 'auto';
    preloader.src = nextUrl;
    preloadRef.current = preloader;
    return () => {
      preloader.removeAttribute('src');
      preloader.load();
      if (preloadRef.current === preloader) preloadRef.current = null;
    };
  }, [trackId, state.repeatMode, state.isShuffle, state.playlist, state.shuffleQueue]);

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
