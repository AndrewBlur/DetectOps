import React from 'react';
import { Container, Typography, Box, Card, CardContent, Button } from '@mui/material';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const PredictionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
      </Box>

      <Card sx={{ textAlign: 'center', p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ mb: 3, display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'primary.dark', color: 'primary.main', opacity: 0.8 }}>
            <OnlinePredictionIcon sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            View Predictions
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            This feature is currently under development. Once your model is trained, you'll be able to upload images for real-time inference and view detection results here.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button variant="contained" size="large" disabled>
              Launch Inference
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Return to Project
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PredictionsPage;
