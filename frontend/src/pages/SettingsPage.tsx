import React from 'react';
import { Container, Typography, Box, Card, CardContent, Button, Stack } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
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

      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your project preferences and account details.
      </Typography>

      <Stack spacing={3}>
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Box sx={{ mr: 3, p: 1.5, borderRadius: 2, bgcolor: 'primary.dark', color: 'primary.main', display: 'flex' }}>
              <SettingsIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Project Configuration</Typography>
              <Typography variant="body2" color="text.secondary">General settings and model parameters.</Typography>
            </Box>
            <Button variant="outlined" disabled size="small">Configure</Button>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', opacity: 0.7 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Settings are coming soon. You'll be able to manage team access, API keys, and notification preferences here.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default SettingsPage;
