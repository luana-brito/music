'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { usePlayer } from '@/hooks/usePlayer';
import { CoverArt } from '@/components/ui/CoverArt';
import { AddToPlaylistDialog } from '@/components/catalog/AddToPlaylistDialog';
import { EASE, MUTED, ORANGE } from '@/lib/theme';
import { getCapaUrl } from '@/lib/capa';
import { formatDuration } from '@/lib/format';

export function Player() {
  const {
    state,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    play,
    audioRef,
  } = usePlayer();
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const countedTrack = useRef<string | null>(null);
  const swipeStartY = useRef(0);

  const currentTrack = state.currentTrack?.musica;
  const capaSrc = currentTrack ? getCapaUrl(currentTrack) : null;
  const accent = currentTrack?.tribo?.cor || ORANGE;
  const upcoming = (() => {
    if (!currentTrack) return [];
    if (state.isShuffle && state.shuffleQueue.length) {
      const index = state.shuffleQueue.indexOf(currentTrack.id);
      return state.shuffleQueue
        .slice(index + 1, index + 8)
        .map((id) => state.playlist.find((item) => item.musica.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
    }
    const trackIndex = state.playlist.findIndex((item) => item.musica.id === currentTrack.id);
    return trackIndex >= 0 ? state.playlist.slice(trackIndex + 1, trackIndex + 8) : [];
  })();

  const togglePlay = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!currentTrack) return;
    if (state.isPlaying) pause();
    else resume();
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
  }, [state.volume, audioRef]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack?.id]);

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
    audio.addEventListener('loadedmetadata', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [state.repeatMode, next, audioRef]);

  useEffect(() => {
    if (!currentTrack || !state.isPlaying) return;
    if (countedTrack.current === currentTrack.id) return;
    const timer = window.setTimeout(() => {
      countedTrack.current = currentTrack.id;
      fetch(`/api/musicas/${currentTrack.id}/play`, { method: 'POST' }).catch(() => {});
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [currentTrack, state.isPlaying]);

  useEffect(() => {
    countedTrack.current = null;
  }, [currentTrack?.id]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const openAddToPlaylist = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!currentTrack) return;
    setAddOpen(true);
  };

  const progress = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
      <Typography sx={{ minWidth: 36, color: MUTED, fontSize: 11, textAlign: 'right' }}>
        {formatDuration(currentTime)}
      </Typography>
      <Slider
        size="small"
        min={0}
        max={duration || 0}
        value={Math.min(currentTime, duration || 0)}
        onChange={(_, value) => seek(value as number)}
        disabled={!currentTrack}
      />
      <Typography sx={{ minWidth: 36, color: MUTED, fontSize: 11 }}>{formatDuration(duration)}</Typography>
    </Box>
  );

  return (
    <>
      {!expanded && (
        <Box
          onClick={() => setExpanded(true)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            left: 8,
            right: 8,
            bottom: 'calc(64px + 8px + env(safe-area-inset-bottom, 0px))',
            zIndex: 1100,
            height: 62,
            alignItems: 'center',
            gap: 1.25,
            px: 1,
            pr: 0.5,
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: 'pointer',
            background: `linear-gradient(90deg, ${accent}66 0%, rgba(28,28,28,0.94) 58%)`,
            backdropFilter: 'blur(18px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
          }}
        >
          <CoverArt name={currentTrack?.nome || 'B'} color={accent} src={capaSrc} size={44} rounded={8} shadow={false} />
          <Box minWidth={0} flex={1}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>
              {currentTrack?.nome || 'Nenhuma faixa'}
            </Typography>
            <Typography noWrap sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.25 }}>
              {currentTrack ? currentTrack.tribo?.nome : 'Escolha uma música'}
            </Typography>
          </Box>
          <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={togglePlay} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label={state.isPlaying ? 'Pausar' : 'Tocar'}>
              {state.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={(event) => { event.stopPropagation(); next(); }} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Próxima">
              <SkipNextIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: 0,
              height: 3,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.22)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ width: `${progressPct}%`, height: '100%', background: ORANGE, borderRadius: 99 }} />
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          position: 'relative',
          zIndex: 1100,
          background: 'rgba(18,18,18,0.88)',
          backdropFilter: 'blur(22px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 2.4,
          px: 2.5,
          py: 1.2,
          minHeight: 86,
          gridTemplateColumns: 'minmax(180px, 1.1fr) 2fr minmax(200px, 1fr)',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <CoverArt name={currentTrack?.nome || 'B'} color={accent} src={capaSrc} size={56} rounded={8} />
          <Box minWidth={0} flex={1}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 14 }}>
              {currentTrack?.nome || 'Nenhuma faixa'}
            </Typography>
            <Typography noWrap sx={{ color: MUTED, fontSize: 12 }}>
              {currentTrack ? currentTrack.tribo?.nome : 'Escolha uma música'}
            </Typography>
          </Box>
          <IconButton onClick={openAddToPlaylist} disabled={!currentTrack} sx={{ color: MUTED }} aria-label="Adicionar à playlist">
            <PlaylistAddIcon />
          </IconButton>
        </Box>

        <Stack spacing={0.2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <IconButton size="small" onClick={toggleShuffle} sx={{ color: state.isShuffle ? ORANGE : MUTED }} aria-label="Aleatório">
              <ShuffleIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={prev} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Anterior">
              <SkipPreviousIcon />
            </IconButton>
            <IconButton
              onClick={togglePlay}
              disabled={!currentTrack}
              aria-label={state.isPlaying ? 'Pausar' : 'Tocar'}
              sx={{
                width: 42,
                height: 42,
                background: ORANGE,
                color: '#000',
                '&:hover': { background: '#FF8533', transform: 'scale(1.06)' },
                transition: `transform 0.2s ${EASE}, background 0.2s ${EASE}`,
              }}
            >
              {state.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={next} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Próxima">
              <SkipNextIcon />
            </IconButton>
            <IconButton size="small" onClick={toggleRepeat} sx={{ color: state.repeatMode !== 'none' ? ORANGE : MUTED }} aria-label="Repetir">
              {state.repeatMode === 'one' ? <RepeatOneIcon fontSize="small" /> : <RepeatIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Box sx={{ width: '100%', maxWidth: 560 }}>{progress}</Box>
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
          {state.volume === 0 ? <VolumeOffIcon sx={{ color: MUTED, fontSize: 20 }} /> : <VolumeUpIcon sx={{ color: MUTED, fontSize: 20 }} />}
          <Slider size="small" min={0} max={1} step={0.05} value={state.volume} onChange={(_, value) => setVolume(value as number)} sx={{ width: 110 }} />
        </Box>
      </Box>

      {expanded && (
        <Box
          onTouchStart={(event) => {
            swipeStartY.current = event.touches[0].clientY;
          }}
          onTouchEnd={(event) => {
            if (event.changedTouches[0].clientY - swipeStartY.current > 90) setExpanded(false);
          }}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 2000,
            backgroundColor: '#121212',
            backgroundImage: `linear-gradient(180deg, ${accent} 0%, #121212 42%, #000 100%)`,
            flexDirection: 'column',
            px: 3,
            pt: 'calc(10px + env(safe-area-inset-top, 0px))',
            pb: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Box sx={{ width: 36, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.35)', mx: 'auto', mb: 1.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setExpanded(false)} sx={{ color: '#fff' }} aria-label="Fechar player">
              <KeyboardArrowDownIcon />
            </IconButton>
            <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 12, letterSpacing: 1.4, pr: 5 }}>
              TOCANDO AGORA
            </Typography>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' }}>
                <CoverArt name={currentTrack?.nome || 'B'} color={accent} src={capaSrc} size="100%" rounded={12} />
              </Box>
            </Box>

            <Box sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box minWidth={0} flex={1}>
                <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.15 }} noWrap>
                  {currentTrack?.nome || 'Nenhuma faixa'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, mt: 0.5 }} noWrap>
                  {currentTrack ? `${currentTrack.tribo?.nome} • ${currentTrack.ano}` : 'Escolha uma música'}
                </Typography>
              </Box>
              <IconButton onClick={openAddToPlaylist} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Adicionar à playlist">
                <PlaylistAddIcon />
              </IconButton>
            </Box>

            <Box sx={{ mt: 1 }}>{progress}</Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, mt: 1.5, mb: 2 }}>
              <IconButton onClick={toggleShuffle} sx={{ color: state.isShuffle ? ORANGE : '#fff' }} aria-label="Aleatório">
                <ShuffleIcon />
              </IconButton>
              <IconButton onClick={prev} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Anterior">
                <SkipPreviousIcon sx={{ fontSize: 42 }} />
              </IconButton>
              <IconButton
                onClick={togglePlay}
                disabled={!currentTrack}
                aria-label={state.isPlaying ? 'Pausar' : 'Tocar'}
                sx={{
                  width: 76,
                  height: 76,
                  background: ORANGE,
                  color: '#000',
                  '&:hover': { background: '#FF8533', transform: 'scale(1.04)' },
                }}
              >
                {state.isPlaying ? <PauseIcon sx={{ fontSize: 40 }} /> : <PlayArrowIcon sx={{ fontSize: 40 }} />}
              </IconButton>
              <IconButton onClick={next} disabled={!currentTrack} sx={{ color: '#fff' }} aria-label="Próxima">
                <SkipNextIcon sx={{ fontSize: 42 }} />
              </IconButton>
              <IconButton onClick={toggleRepeat} sx={{ color: state.repeatMode !== 'none' ? ORANGE : '#fff' }} aria-label="Repetir">
                {state.repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
              </IconButton>
            </Box>

            {upcoming.length > 0 && (
              <Box sx={{ overflowY: 'auto', maxHeight: 140 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, color: MUTED, mb: 1 }}>A SEGUIR</Typography>
                {upcoming.slice(0, 3).map((item) => (
                  <Box
                    key={item.musica.id}
                    onClick={() => {
                      const startIndex = state.playlist.findIndex((track) => track.musica.id === item.musica.id);
                      play(state.playlist, startIndex >= 0 ? startIndex : 0);
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.7, cursor: 'pointer' }}
                  >
                    <CoverArt name={item.musica.nome} color={item.musica.tribo?.cor} src={getCapaUrl(item.musica)} size={40} rounded={8} />
                    <Box minWidth={0}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>{item.musica.nome}</Typography>
                      <Typography noWrap sx={{ color: MUTED, fontSize: 12 }}>{item.musica.tribo?.nome}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <AddToPlaylistDialog open={addOpen} musicaId={currentTrack?.id ?? null} onClose={() => setAddOpen(false)} />
    </>
  );
}
