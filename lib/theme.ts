import { createTheme } from '@mui/material/styles';

export const PURPLE = '#8B5CF6';
export const PURPLE_HOVER = '#A78BFA';
export const PURPLE_SOFT = 'rgba(139, 92, 246, 0.16)';
export const PURPLE_DEEP = '#5B21B6';
export const GREEN = '#10B981';
export const GREEN_BRIGHT = '#34E28A';
export const GREEN_HOVER = '#34E28A';
export const GREEN_SOFT = 'rgba(16, 185, 129, 0.14)';
export const BRAND_GRADIENT = `linear-gradient(135deg, ${PURPLE} 0%, ${GREEN} 100%)`;
export const PROGRESS_GRADIENT = `linear-gradient(90deg, ${PURPLE}, ${GREEN})`;
export const NAV_ACTIVE = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(16,185,129,0.12))';
export const BLACK = '#08090D';
export const SURFACE = '#14161D';
export const ELEVATED = '#100A18';
export const CARD = '#14161D';
export const HOVER = '#1B1E27';
export const MUTED = '#9299A6';
export const TEXT_MUTED = '#6B7080';
export const TEXT = '#F2F2F5';
export const DANGER = '#EF4444';
export const DANGER_HOVER = '#DC2626';
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const FONT_DISPLAY = 'var(--font-display), Anton, Impact, sans-serif';
export const FONT_MONO = 'var(--font-mono), "JetBrains Mono", ui-monospace, monospace';
export const FONT_SANS = 'var(--font-sans), Inter, Helvetica, Arial, sans-serif';

export const ORANGE = PURPLE;
export const ORANGE_HOVER = PURPLE_HOVER;
export const ORANGE_SOFT = PURPLE_SOFT;

export const displayTitle = {
  fontFamily: FONT_DISPLAY,
  fontWeight: 400,
  letterSpacing: '0.01em',
  textTransform: 'none' as const,
};

export const monoLabel = {
  fontFamily: FONT_MONO,
  fontSize: 11,
  letterSpacing: '1.2px',
  textTransform: 'uppercase' as const,
  fontWeight: 500,
};

export function pageBg(accent = PURPLE) {
  return [
    `radial-gradient(110% 80% at 8% 100%, ${accent}2e 0%, transparent 55%)`,
    `radial-gradient(90% 70% at 100% 0%, ${GREEN}1f 0%, transparent 48%)`,
    `linear-gradient(180deg, ${ELEVATED} 0%, ${BLACK} 42%, ${SURFACE} 100%)`,
  ].join(', ');
}

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: PURPLE,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: GREEN,
      contrastText: '#000000',
    },
    error: {
      main: DANGER,
      dark: DANGER_HOVER,
      contrastText: '#FFFFFF',
    },
    background: {
      default: BLACK,
      paper: SURFACE,
    },
    text: {
      primary: TEXT,
      secondary: MUTED,
    },
    divider: 'rgba(255,255,255,0.06)',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 1024,
      lg: 1280,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: FONT_SANS,
    h1: { ...displayTitle, fontSize: '2.4rem' },
    h2: { ...displayTitle, fontSize: '2rem' },
    h3: { ...displayTitle, fontSize: '1.7rem' },
    h4: { ...displayTitle, fontSize: '1.45rem' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BLACK,
          color: TEXT,
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.16)',
          borderRadius: 99,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(255,255,255,0.28)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 44,
          transition: `transform 0.2s ${EASE}, background 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
        },
        containedPrimary: {
          fontWeight: 800,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: PURPLE_HOVER,
            boxShadow: '0 8px 22px rgba(139,92,246,0.32)',
            transform: 'scale(1.03)',
          },
        },
        containedSecondary: {
          fontWeight: 800,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: GREEN_BRIGHT,
            boxShadow: '0 8px 22px rgba(16,185,129,0.28)',
            transform: 'scale(1.03)',
          },
        },
        containedError: {
          '&:hover': {
            backgroundColor: DANGER_HOVER,
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.14)',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.28)',
            background: 'rgba(255,255,255,0.06)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          transition: `transform 0.2s ${EASE}, background 0.2s ${EASE}, color 0.2s ${EASE}`,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: GREEN,
          padding: '10px 0',
          '&:hover .MuiSlider-thumb, &.Mui-focusVisible .MuiSlider-thumb': {
            opacity: 1,
          },
        },
        thumb: {
          width: 12,
          height: 12,
          opacity: 0,
          backgroundColor: GREEN_BRIGHT,
          transition: `opacity 0.15s ${EASE}, box-shadow 0.15s ${EASE}`,
          '&:hover, &.Mui-focusVisible, &.Mui-active': {
            opacity: 1,
            boxShadow: '0 0 0 6px rgba(16,185,129,0.18)',
          },
        },
        track: {
          height: 4,
          border: 'none',
          backgroundImage: PROGRESS_GRADIENT,
          boxShadow: '0 0 8px rgba(16,185,129,0.5)',
        },
        rail: {
          height: 4,
          opacity: 1,
          backgroundColor: 'rgba(255,255,255,0.18)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE,
          backgroundImage: 'none',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          '@media (max-width: 639px)': {
            margin: 0,
            width: '100vw',
            maxWidth: '100vw',
            maxHeight: '92dvh',
            borderRadius: '16px 16px 0 0',
            alignSelf: 'flex-end',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          transition: `background 0.2s ${EASE}`,
          '&:hover': {
            background: 'rgba(255,255,255,0.07)',
          },
          '&.Mui-focused': {
            background: 'rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 44,
          transition: `background 0.2s ${EASE}, color 0.2s ${EASE}`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: SURFACE,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 64,
          minHeight: 44,
        },
      },
    },
  },
});
