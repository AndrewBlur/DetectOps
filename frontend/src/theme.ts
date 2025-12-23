import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38BDF8', // Cyan/Sky Blue - Vibrant and modern
      light: '#7DD3FC',
      dark: '#0284C7',
      contrastText: '#0F172A',
    },
    secondary: {
      main: '#818CF8', // Indigo - Complementary
      light: '#A5B4FC',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F172A', // Slate 900 - Deep, rich background
      paper: '#1E293B',   // Slate 800 - Cards/Surfaces
    },
    text: {
      primary: '#F1F5F9', // Slate 100
      secondary: '#94A3B8', // Slate 400
    },
    error: {
      main: '#EF4444', // Red 500
    },
    success: {
      main: '#22C55E', // Green 500
    },
    warning: {
      main: '#F59E0B', // Amber 500
    },
    divider: '#334155', // Slate 700
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#CBD5E1', // Slate 300
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#94A3B8', // Slate 400
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          overflowX: 'hidden',
          backgroundColor: '#0F172A',
          scrollbarColor: '#334155 #0F172A',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0F172A',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#334155',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0F172A', 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1E293B',
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F172A',
          borderRight: '1px solid #1E293B',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.9rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
          color: '#0F172A',
          '&:hover': {
            background: 'linear-gradient(135deg, #7DD3FC 0%, #0369A1 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B', // Slate 800
          backgroundImage: 'none',
          border: '1px solid #334155', // Slate 700
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            borderColor: '#475569',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#1E293B', 0.5),
            '& fieldset': {
              borderColor: '#334155',
            },
            '&:hover fieldset': {
              borderColor: '#475569',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#38BDF8',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          padding: '10px 16px',
          '&.active': {
            backgroundColor: alpha('#38BDF8', 0.15),
            color: '#38BDF8',
            '& .MuiListItemIcon-root': {
              color: '#38BDF8',
            },
          },
          '&:hover': {
            backgroundColor: alpha('#38BDF8', 0.05),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '40px',
          color: '#94A3B8',
        },
      },
    },
  },
});

export default theme;
