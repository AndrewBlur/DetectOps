import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1">
          This is a placeholder page for user settings. Options for managing your account, API keys, and application preferences will be available here.
        </Typography>
      </Box>
    </Container>
  );
};

export default SettingsPage;
