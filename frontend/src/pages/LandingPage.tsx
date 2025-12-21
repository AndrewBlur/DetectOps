import React from 'react';
import { Box, Button, Container, Typography, AppBar, Toolbar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/system';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A2027 30%, #2C3E50 90%)'
    }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            DetectOps
          </Typography>
          <Button color="inherit" variant="outlined" onClick={() => navigate('/login')}>Login</Button>
          <Button color="primary" variant="contained" sx={{ ml: 2 }} onClick={() => navigate('/register')}>Get Started</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        {/* Hero Section */}
        <Box
          sx={{
            py: { xs: 8, md: 16 },
            textAlign: 'center',
            animation: `${fadeIn} 1s ease-out`,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 'bold', mb: 2, letterSpacing: '1px' }}
          >
            Your Personal Vision AI Workspace
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            An open-source platform to upload, annotate, and train computer vision models, inspired by Azure Vision.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.2rem'
            }}
            onClick={() => navigate('/login')}
          >
            Try It Out Now
          </Button>
        </Box>

        {/* About Section */}
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Typography variant="h4" component="h2" sx={{ textAlign: 'center', mb: 6, fontWeight: 'bold' }}>
            How It Works
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 4
          }}>
            <Box sx={{ p: 3, border: '1px solid #4A5568', borderRadius: 2, background: '#2C3E50' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>1. Upload</Typography>
              <Typography color="text.secondary">
                Easily upload your images in batches. We store them securely, ready for the next step.
              </Typography>
            </Box>
            <Box sx={{ p: 3, border: '1px solid #4A5568', borderRadius: 2, background: '#2C3E50' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>2. Annotate</Typography>
              <Typography color="text.secondary">
                Use our built-in tools to draw bounding boxes and apply labels to your image data. (Coming Soon)
              </Typography>
            </Box>
            <Box sx={{ p: 3, border: '1px solid #4A5568', borderRadius: 2, background: '#2C3E50' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>3. Train & Predict</Typography>
              <Typography color="text.secondary">
                Train your object detection model and use it to make predictions on new images. (Coming Soon)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
