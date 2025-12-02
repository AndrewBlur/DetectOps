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
  IconButton,
  Checkbox,
  FormControlLabel
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
  selectedImages: number[];
  onSelectedImagesChange: (selectedIds: number[]) => void;
  onDeleteSelected: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDeleteSuccess, selectedImages, onSelectedImagesChange, onDeleteSelected }) => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onSelectedImagesChange(images.map((image) => image.id));
    } else {
      onSelectedImagesChange([]);
    }
  };

  const handleSelectOne = (imageId: number) => {
    const newSelected = selectedImages.includes(imageId)
      ? selectedImages.filter((id) => id !== imageId)
      : [...selectedImages, imageId];
    onSelectedImagesChange(newSelected);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedImages.length === images.length && images.length > 0}
              indeterminate={selectedImages.length > 0 && selectedImages.length < images.length}
              onChange={handleSelectAll}
            />
          }
          label="Select All"
        />
        {selectedImages.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDeleteSelected}
          >
            Delete Selected ({selectedImages.length})
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid item key={image.id} xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                position: 'relative',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                boxShadow: selectedImages.includes(image.id) ? 8 : 1,
                transform: selectedImages.includes(image.id) ? 'scale(1.02)' : 'scale(1)',
                border: selectedImages.includes(image.id) ? '2px solid' : '2px solid transparent',
                borderColor: selectedImages.includes(image.id) ? 'primary.main' : 'transparent',
              }}
            >
              <Checkbox
                checked={selectedImages.includes(image.id)}
                onChange={() => handleSelectOne(image.id)}
                sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.7)' }}
              />
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
