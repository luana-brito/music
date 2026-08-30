import { createTheme } from '@mui/material/styles';

export const ORANGE = '#FF6B00';
export const ORANGE_HOVER = '#FF8500';
export const BLACK = '#000000';
export const SURFACE = '#121212';
export const ELEVATED = '#181818';
export const HOVER = '#282828';
export const MUTED = '#B3B3B3';

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
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: BLACK,
          color: '#FFFFFF',
        },
        '*::-webkit-scrollbar': {
          width: 12,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#4d4d4d',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          borderRadius: 999,
          fontWeight: 700,
          '&:hover': {
            backgroundColor: ORANGE_HOVER,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: ORANGE,
          padding: '10px 0',
        },
        thumb: {
          width: 12,
          height: 12,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0 0 0 6px rgba(255,107,0,0.16)',
          },
        },
        rail: {
          opacity: 0.3,
          backgroundColor: '#5a5a5a',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});
