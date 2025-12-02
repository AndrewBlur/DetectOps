import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AnnotatePage: React.FC = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Annotate Images
        </Typography>
        <Typography variant="body1">
          This is a placeholder page for the image annotation tool. The functionality to draw bounding boxes and assign labels to images will be implemented here.
        </Typography>
      </Box>
    </Container>
  );
};

export default AnnotatePage;
