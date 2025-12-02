import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

interface Image {
  id: number;
  filepath: string;
  storage_url: string;
  uploaded_at: string;
}

interface ImageGalleryProps {
  images: Image[];
  onDeleteSuccess: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDeleteSuccess }) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);


  const handleDeleteClick = (imageId: number) => {
    setSelectedImageId(imageId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImageId(null);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedImageId === null) return;

    setLoading(true);
    setError(null);

    try {
      await api.delete(`/images/${selectedImageId}`);
      onDeleteSuccess(); // Notify parent to refresh images
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid item key={image.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              onMouseEnter={() => setHoveredImageId(image.id)}
              onMouseLeave={() => setHoveredImageId(null)}
              sx={{
                position: 'relative',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardMedia
                component="img"
                height="194"
                image={image.storage_url}
                alt={image.filepath.split('/').pop()}
                sx={{ objectFit: 'contain', backgroundColor: 'background.paper' }}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {image.filepath.split('/').pop()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Uploaded: {new Date(image.uploaded_at).toLocaleDateString()}
                </Typography>
                {hoveredImageId === image.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: '50%',
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.2s ease-in-out',
                    }}
                  >
                    <IconButton
                      aria-label="delete"
                      size="small"
                      onClick={() => handleDeleteClick(image.id)}
                      disabled={loading}
                      sx={{ color: 'white' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this image? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;
