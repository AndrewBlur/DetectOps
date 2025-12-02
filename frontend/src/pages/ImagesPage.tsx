import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import ImageGallery from '../components/ImageGallery';

interface Image {
  id: number;
  filepath: string;
  storage_url: string;
  uploaded_at: string;
}

const DashboardPage: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Image[]>('/images/mine');
      setImages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleImageUploadSuccess = () => {
    fetchImages(); // Refresh images after successful upload
  };

  const handleImageDeleteSuccess = () => {
    fetchImages(); // Refresh images after successful delete
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Image Dashboard
        </Typography>

        <Box sx={{ mb: 4 }}>
          <ImageUpload onUploadSuccess={handleImageUploadSuccess} />
        </Box>

        <Typography variant="h5" component="h2" gutterBottom>
          Your Uploaded Images
        </Typography>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && images.length === 0 && (
          <Typography variant="body1">No images uploaded yet. Upload some above!</Typography>
        )}
        {!loading && !error && images.length > 0 && (
          <ImageGallery images={images} onDeleteSuccess={handleImageDeleteSuccess} />
        )}
      </Box>
    </Container>
  );
};

export default DashboardPage;
