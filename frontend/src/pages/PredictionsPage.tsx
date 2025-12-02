import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const PredictionsPage: React.FC = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          View Predictions
        </Typography>
        <Typography variant="body1">
          This is a placeholder page for viewing model predictions. Once a model is trained, you will be able to upload new images here and see the detection results.
        </Typography>
      </Box>
    </Container>
  );
};

export default PredictionsPage;
