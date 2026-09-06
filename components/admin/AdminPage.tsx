'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { displayTitle } from '@/lib/theme';

interface AdminPageProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPage({ title, action, children }: AdminPageProps) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5, md: 4 },
        pb: { xs: 4, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2.5, md: 3.5 },
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          component="h1"
          sx={{ ...displayTitle, fontSize: { xs: 26, sm: 30, md: 36 }, m: 0 }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}
