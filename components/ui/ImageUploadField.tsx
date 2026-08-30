'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { MUTED } from '@/lib/theme';

interface ImageUploadFieldProps {
  id: string;
  label: string;
  hint?: string;
  previewUrl?: string | null;
  uploading?: boolean;
  onFile: (file: File) => void;
  onClear?: () => void;
}

export function ImageUploadField({ id, label, hint, previewUrl, uploading, onFile, onClear }: ImageUploadFieldProps) {
  return (
    <Box sx={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 2, p: 2 }}>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        style={{ display: 'none' }}
        id={id}
        type="file"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 1,
            overflow: 'hidden',
            background: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {previewUrl ? (
            <Box component="img" src={previewUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <PhotoCameraIcon sx={{ color: MUTED }} />
          )}
        </Box>
        <Box>
          <label htmlFor={id}>
            <Button component="span" variant="outlined" size="small" disabled={uploading}>
              {uploading ? 'Enviando...' : label}
            </Button>
          </label>
          {previewUrl && onClear && (
            <Button size="small" onClick={onClear} sx={{ ml: 1 }}>
              Remover
            </Button>
          )}
          {hint && (
            <Typography variant="caption" sx={{ display: 'block', color: MUTED, mt: 0.8 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
