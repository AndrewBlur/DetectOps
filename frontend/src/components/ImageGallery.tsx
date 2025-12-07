import React, { useState } from 'react';
import {
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

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onDeleteSuccess,
  selectedImages,
  onSelectedImagesChange,
  onDeleteSelected,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
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
    if (!selectedImageId) return;

    setLoading(true);
    setError(null);
    try {
      await api.delete(`/images/${selectedImageId}`);
      onDeleteSuccess();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete image.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    onSelectedImagesChange(
      selectedImages.includes(id)
        ? selectedImages.filter((x) => x !== id)
        : [...selectedImages, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectedImagesChange(e.target.checked ? images.map((img) => img.id) : []);
  };

  return (
    <>
      {/* Header: Select All + Delete Selected */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
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

      {/* ---- CARD GRID ---- */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 3,
          pb: 4,
        }}
      >
        {images.map((image) => (
          <Card
            key={image.id}
            sx={{
              height: 260,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              transition: "0.2s",
              boxShadow: selectedImages.includes(image.id) ? 6 : 1,
              border: selectedImages.includes(image.id)
                ? "2px solid #00e676"
                : "2px solid transparent",
              "&:hover": {
                transform: "scale(1.02)",
              },
            }}
          >
            {/* Select Checkbox */}
            <Checkbox
              checked={selectedImages.includes(image.id)}
              onChange={() => toggleSelect(image.id)}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 3,
                background: "#ffffff88",
                borderRadius: "4px",
              }}
            />

            {/* Delete Icon */}
            <IconButton
              onClick={() => handleDeleteClick(image.id)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 3,
                background: "rgba(0,0,0,0.6)",
                color: "white",
                borderRadius: "50%",
                "&:hover": { background: "rgba(0,0,0,0.8)" },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            {/* Image */}
            <CardMedia
              component="img"
              src={image.storage_url}
              alt="uploaded image"
              sx={{
                height: 160,
                width: "100%",
                objectFit: "cover",
              }}
            />

            {/* Filename + Date */}
            <CardContent sx={{ textAlign: "center", overflow: "hidden" }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontSize: 13, fontWeight: 500 }}
              >
                {image.filepath.split("/").pop()}
              </Typography>

              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {new Date(image.uploaded_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ---- DELETE CONFIRMATION MODAL ---- */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Delete Image?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;
