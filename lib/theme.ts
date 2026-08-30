import { createTheme } from '@mui/material/styles';

export const ORANGE = '#FF6B00';
export const ORANGE_HOVER = '#FF8533';
export const ORANGE_SOFT = 'rgba(255, 107, 0, 0.16)';
export const BLACK = '#000000';
export const SURFACE = '#121212';
export const ELEVATED = '#181818';
export const CARD = '#1A1A1A';
export const HOVER = '#2A2A2A';
export const MUTED = '#A7A7A7';
export const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function pageBg(accent = ORANGE) {
  return `linear-gradient(180deg, ${accent}26 0%, #1a1a1a 170px, ${SURFACE} 380px)`;
}

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ORANGE,
      contrastText: '#000000',
    },
    secondary: {
      main: '#FFB347',
    },
    background: {
      default: BLACK,
      paper: ELEVATED,
    },
    text: {
      primary: '#FFFFFF',
      secondary: MUTED,
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: 'var(--font-inter), Inter, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BLACK,
          color: '#FFFFFF',
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
          transition: `transform 0.2s ${EASE}, background 0.2s ${EASE}, box-shadow 0.2s ${EASE}`,
        },
        containedPrimary: {
          fontWeight: 800,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: ORANGE_HOVER,
            boxShadow: '0 8px 22px rgba(255,107,0,0.28)',
            transform: 'scale(1.03)',
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
          transition: `transform 0.2s ${EASE}, background 0.2s ${EASE}, color 0.2s ${EASE}`,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: ORANGE,
          padding: '10px 0',
          '&:hover .MuiSlider-thumb, &.Mui-focusVisible .MuiSlider-thumb': {
            opacity: 1,
          },
          '&:hover .MuiSlider-track': {
            backgroundColor: ORANGE_HOVER,
          },
        },
        thumb: {
          width: 12,
          height: 12,
          opacity: 0,
          transition: `opacity 0.15s ${EASE}, box-shadow 0.15s ${EASE}`,
          '&:hover, &.Mui-focusVisible, &.Mui-active': {
            opacity: 1,
            boxShadow: '0 0 0 6px rgba(255,107,0,0.18)',
          },
        },
        track: {
          height: 4,
          border: 'none',
          transition: `background 0.15s ${EASE}`,
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
          backgroundColor: ELEVATED,
          backgroundImage: 'none',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
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
          transition: `background 0.2s ${EASE}, color 0.2s ${EASE}`,
        },
      },
    },
  },
});
