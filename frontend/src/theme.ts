import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00C49F', // Vibrant Teal
    },
    secondary: {
      main: '#FFC658', // A complementary amber/yellow
    },
    background: {
      default: '#1A2027', // Deep Charcoal/Navy
      paper: '#2C3E50', // Lighter shade for surfaces like cards and sidebars
    },
    text: {
      primary: '#E0E0E0', // Light Gray for body text
      secondary: '#B0B0B0', // Dimmer gray for secondary text
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
    },
    h2: {
        fontSize: '2.5rem',
        fontWeight: 700,
    },
    h4: {
        fontSize: '2rem',
        fontWeight: 600,
    },
    h5: {
        fontSize: '1.5rem',
        fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          overflow-x: hidden;
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2C3E50', // Match paper color for a unified look
          boxShadow: 'none',
          borderBottom: '1px solid #4A5568'
        }
      }
    }
  }
});

export default theme;
