import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedImages([]); // Clear selection on fetch
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
    setPage(1); // Reset to first page after upload
    fetchImages();
  };

  const handleImageDeleteSuccess = () => {
    // If the last image on a page is deleted, go to the previous page
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPageSize(event.target.value as number);
    setPage(1); // Reset to first page on page size change
  };

  const handleSelectedImagesChange = (newSelected: number[]) => {
    setSelectedImages(newSelected);
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Your Uploaded Images
          </Typography>
          <FormControl size="small" sx={{minWidth: 120}}>
            <InputLabel id="page-size-label">Images per page</InputLabel>
            <Select
              labelId="page-size-label"
              value={pageSize}
              onChange={handlePageSizeChange}
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
        {!loading && !error && images.length === 0 && (
          <Typography variant="body1">No images uploaded yet. Upload some above!</Typography>
        )}
        {!loading && !error && images.length > 0 && (
          <>
            <ImageGallery
              images={images}
              onDeleteSuccess={handleImageDeleteSuccess}
              selectedImages={selectedImages}
              onSelectedImagesChange={handleSelectedImagesChange}
              onDeleteSelected={handleDeleteSelected}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, my: 'auto' }}>Page {page} of {Math.ceil(totalImages/pageSize)}</Typography>
              <Button
                disabled={page * pageSize >= totalImages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ImagesPage;
