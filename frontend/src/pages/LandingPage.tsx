import React from 'react';
import { Box, Button, Container, Typography, AppBar, Toolbar, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
      background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0F172A 100%)',
      overflowX: 'hidden'
    }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ py: 1 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 800, color: 'primary.main', letterSpacing: '-0.02em' }}>
              DetectOps
            </Typography>
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ mr: 2 }}>Login</Button>
            <Button color="primary" variant="contained" onClick={() => navigate('/register')}>Get Started</Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            pt: { xs: 12, md: 20 },
            pb: { xs: 8, md: 16 },
            textAlign: 'center',
            animation: `${fadeIn} 1s ease-out`,
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
            }}
          >
            Vision AI, <br />
            <Box component="span" sx={{ color: 'primary.main', background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Simplified.
            </Box>
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
            Upload images, annotate objects, and train powerful computer vision models in one unified workspace.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ py: 1.5, px: 4, fontSize: '1.1rem', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => navigate('/login')}
            >
              Live Demo
            </Button>
          </Box>
        </Box>

        {/* Feature Section */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Typography variant="overline" display="block" align="center" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
            WORKFLOW
          </Typography>
          <Typography variant="h3" component="h2" align="center" sx={{ mb: 6, fontWeight: 700 }}>
            From Image to Insight
          </Typography>

          <Grid container spacing={4}>
            {[
              { title: '1. Upload', desc: 'Drag and drop your datasets. We handle the storage and organization for you.' },
              { title: '2. Annotate', desc: 'Use our intuitive bounding box tool to label objects with precision.' },
              { title: '3. Train', desc: 'One-click training pipelines to build your custom object detection models.' },
            ].map((feature, index) => (
              <Grid key={index} size={{ xs: 12, md: 4 }}>
                <Card sx={{
                  height: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'primary.light' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ py: 6, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} DetectOps. All rights reserved.
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default LandingPage;
