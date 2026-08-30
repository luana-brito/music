'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { ORANGE } from '@/lib/theme';

interface CoverArtProps {
  name: string;
  color?: string | null;
  src?: string | null;
  size?: number | string;
  rounded?: number;
  shadow?: boolean;
}

export function CoverArt({ name, color, src, size = 48, rounded = 8, shadow = true }: CoverArtProps) {
  const [broken, setBroken] = useState(false);
  const letter = (name || '?').charAt(0).toUpperCase();
  const accent = color || ORANGE;
  const showImage = Boolean(src) && !broken;
  const numericSize = typeof size === 'number' ? size : undefined;

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <Box
      sx={{
        width: size,
        height: numericSize ?? 'auto',
        minWidth: numericSize || 0,
        aspectRatio: numericSize ? undefined : '1 / 1',
        borderRadius: `${rounded}px`,
        background: `linear-gradient(145deg, ${accent} 0%, #141414 88%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: numericSize ? Math.max(14, numericSize * 0.38) : 'clamp(64px, 28vw, 140px)',
        color: '#fff',
        letterSpacing: '-0.04em',
        boxShadow: shadow ? '0 10px 28px rgba(0,0,0,0.38)' : 'none',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src || undefined}
          alt={name}
          onError={() => setBroken(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        letter
      )}
    </Box>
  );
}
