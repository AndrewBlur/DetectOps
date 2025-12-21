import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import ImageGallery from '../components/ImageGallery';

interface Image {
  id: number;
  filepath: string;
  storage_url: string;
  uploaded_at: string;
}

interface PaginatedImageResponse {
  images: Image[];
  total: number;
}

const ImagesPage: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalImages, setTotalImages] = useState<number>(0);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const navigate = useNavigate();

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedImages([]);
    try {
      const response = await api.get<PaginatedImageResponse>('/images/mine', {
        params: { page, page_size: pageSize },
      });
      setImages(response.data.images);
      setTotalImages(response.data.total);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageUploadSuccess = () => {
    setPage(1);
    fetchImages();
  };

  const handleImageDeleteSuccess = () => {
    if (images.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      fetchImages();
    }
  };

  const handleDeleteSelected = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all(selectedImages.map(id => api.delete(`/images/${id}`)));
      setSelectedImages([]);
      fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete selected images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Image Dashboard
        </Typography>

        <Box sx={{ mb: 4 }}>
          <ImageUpload onUploadSuccess={handleImageUploadSuccess} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Your Uploaded Images</Typography>

          <FormControl size="small" sx={{minWidth: 120}}>
            <InputLabel id="page-size-label">Images per page</InputLabel>
            <Select
              labelId="page-size-label"
              value={pageSize}
              onChange={(e: SelectChangeEvent<string>) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              label="Images per page"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && images.length > 0 && (
          <>
            <ImageGallery
              images={images}
              onDeleteSuccess={handleImageDeleteSuccess}
              selectedImages={selectedImages}
              onSelectedImagesChange={setSelectedImages}
              onDeleteSelected={handleDeleteSelected}
              navigate={navigate}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Typography sx={{ mx: 2, my: 'auto' }}>
                Page {page} of {Math.ceil(totalImages / pageSize)}
              </Typography>
              <Button disabled={page * pageSize >= totalImages} onClick={() => setPage(page + 1)}>Next</Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ImagesPage;
