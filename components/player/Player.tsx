'use client';

import React, { useEffect, useState } from 'react';
import { Box, IconButton, Slider, Typography, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DoneIcon from '@mui/icons-material/Done';
import { usePlayer } from '@/hooks/usePlayer';

export function Player() {
  const { state, pause, resume, next, prev, seek, setCurrentTime, setVolume, toggleRepeat, toggleShuffle, downloadOffline, isOffline, getOfflineAudioUrl, audioRef } = usePlayer();
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const currentTrack = state.currentTrack?.musica;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (state.currentTrack && !isOffline(state.currentTrack.musica.id)) {
      setIsLoading(true);
      try {
        await downloadOffline(state.currentTrack.musica);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    let localObjectUrl: string | null = null;
    let cancelled = false;

    const loadSource = async () => {
      if (!state.currentTrack) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setDuration(0);
        return;
      }

      const musica = state.currentTrack.musica;
      const shouldUseOffline = state.currentTrack.isOffline || isOffline(musica.id);

      if (shouldUseOffline) {
        const offlineUrl = await getOfflineAudioUrl(musica.id);
        if (cancelled) {
          if (offlineUrl) URL.revokeObjectURL(offlineUrl);
          return;
        }
        if (offlineUrl) {
          localObjectUrl = offlineUrl;
          audio.src = offlineUrl;
        } else {
          audio.src = musica.blobUrl;
        }
      } else {
        audio.src = musica.blobUrl;
      }

      audio.currentTime = 0;
      setCurrentTime(0);

      if (state.isPlaying) {
        audio.play().catch(() => {});
      }
    };

    loadSource();

    return () => {
      cancelled = true;
      if (localObjectUrl) {
        URL.revokeObjectURL(localObjectUrl);
      }
    };
  }, [state.currentTrack, state.isPlaying, audioRef, setCurrentTime, isOffline, getOfflineAudioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (!state.currentTrack) return;

    if (state.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [state.isPlaying, state.currentTrack, audioRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = state.volume;
  }, [state.volume, audioRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      next();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.repeatMode, next, setCurrentTime, audioRef]);

  if (!currentTrack) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(25,118,210,0.2))',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        zIndex: 1000,
      }}
    >
      <Stack spacing={1}>
        {/* Track info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box flex={1}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {currentTrack.nome}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              {currentTrack.tribo?.nome} • {currentTrack.ano}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDownload} disabled={isLoading || isOffline(currentTrack.id)}>
            {isOffline(currentTrack.id) ? <DoneIcon fontSize="small" /> : <CloudDownloadIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Progress bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ minWidth: 32, color: '#999' }}>
            {formatTime(state.currentTime)}
          </Typography>
          <Slider
            size="small"
            min={0}
            max={duration}
            value={state.currentTime}
            onChange={(_, value) => seek(value as number)}
            sx={{ flex: 1 }}
          />
          <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right', color: '#999' }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton size="small" onClick={toggleRepeat} sx={{ color: state.repeatMode !== 'none' ? '#1976d2' : 'inherit' }}>
            {state.repeatMode === 'one' ? <RepeatOneIcon fontSize="small" /> : <RepeatIcon fontSize="small" />}
          </IconButton>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={prev}>
              <SkipPreviousIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => {
              if (state.isPlaying) {
                pause();
                audioRef.current?.pause();
              } else {
                resume();
                audioRef.current?.play().catch(() => {});
              }
            }}>
              {state.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton size="small" onClick={() => {
              next();
              audioRef.current?.play().catch(() => {});
            }}>
              <SkipNextIcon fontSize="small" />
            </IconButton>
          </Box>

          <IconButton size="small" onClick={toggleShuffle} sx={{ color: state.isShuffle ? '#1976d2' : 'inherit' }}>
            <ShuffleIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Volume */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolumeUpIcon fontSize="small" sx={{ color: '#999' }} />
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.1}
            value={state.volume}
            onChange={(_, value) => setVolume(value as number)}
          />
        </Box>
      </Stack>
    </Box>
  );
}
