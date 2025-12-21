import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { Annotator } from '../components/Annotator';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ImageDetails {
  id: number;
  filepath: string;
  storage_url: string;
  uploaded_at: string;
}

const ImageViewPage: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      setError("Image ID is missing.");
      setLoading(false);
      return;
    }

    const fetchImageDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<ImageDetails>(`/images/${imageId}`);
        setImageDetails(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || `Failed to fetch image ${imageId}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchImageDetails();
  }, [imageId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!imageDetails) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Image not found.</Alert>
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">You must be logged in to annotate images.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Annotate Image: {imageDetails.filepath.split('/').pop()}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Annotator
          imageUrl={imageDetails.storage_url}
          imageId={imageDetails.id}

        />
      </Box>
    </Container>
  );
};

export default ImageViewPage;
