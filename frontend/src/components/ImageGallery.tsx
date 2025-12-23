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
  FormControlLabel,
  CardActionArea,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { deleteImage } from '../services/api';
import { useParams } from 'react-router-dom';

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
  navigate: (path: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onDeleteSuccess,
  selectedImages,
  onSelectedImagesChange,
  onDeleteSelected,
  navigate // Now received from props to avoid redundant hooks calls if parent passes it
}) => {
  const theme = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  // const navigate = useNavigate(); // Used from props
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = (event: React.MouseEvent, imageId: number) => {
    event.stopPropagation();
    setSelectedImageId(imageId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImageId(null);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedImageId || !projectId) return;

    setLoading(true);
    setError(null);
    try {
      await deleteImage(Number(projectId), selectedImageId);
      onDeleteSuccess();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete image.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    onSelectedImagesChange(
      selectedImages.includes(id)
        ? selectedImages.filter((x) => x !== id)
        : [...selectedImages, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectedImagesChange(e.target.checked ? images.map((img) => img.id) : []);
  };

  const handleCardClick = (imageId: number) => {
    navigate(`/projects/${projectId}/images/${imageId}/annotate`);
  };

  return (
    <>
      {/* Header: Select All + Delete Selected */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selectedImages.length === images.length && images.length > 0}
              indeterminate={selectedImages.length > 0 && selectedImages.length < images.length}
              onChange={handleSelectAll}
              color="primary"
            />
          }
          label={<Typography variant="body2" color="text.secondary">Select All</Typography>}
        />

        {selectedImages.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onDeleteSelected}
            size="small"
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
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 3,
          pb: 4,
        }}
      >
        {images.map((image) => (
          <Card
            key={image.id}
            sx={{
              height: 280,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              transition: "all 0.2s ease-in-out",
              boxShadow: selectedImages.includes(image.id) ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper', // Ensure card background
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
                borderColor: 'transparent',
              },
            }}
          >
            <CardActionArea onClick={() => handleCardClick(image.id)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>

              {/* Select Checkbox */}
              <Checkbox
                checked={selectedImages.includes(image.id)}
                onClick={(e) => toggleSelect(e, image.id)}
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 3,
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
              />

              {/* Delete Icon */}
              <IconButton
                onClick={(e) => handleDeleteClick(e, image.id)}
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 3,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": { backgroundColor: theme.palette.error.main },
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
                  height: 180,
                  width: "100%",
                  objectFit: "cover",
                  backgroundColor: "#000", // Placeholder background
                }}
              />

              {/* Filename + Date */}
              <CardContent sx={{ textAlign: "left", width: '100%', p: 2, flexGrow: 1 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  title={image.filepath.split("/").pop()}
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {image.filepath.split("/").pop()}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {new Date(image.uploaded_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </CardActionArea>

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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={loading} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading} autoFocus>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;

