import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Typography, CircularProgress, Alert, Grid, IconButton, Box, Card, CardContent, useTheme, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAnnotatedImages, getAnnotations, deleteAnnotation } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

// Define the types for the data we'll be fetching
interface AnnotatedImageInfo {
  id: number;
  storage_url: string;
  filepath: string;
}

interface Annotation {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tag: string;
}

interface ImageWithAnnotations extends AnnotatedImageInfo {
  annotations: Annotation[];
}

// A component to display a single annotated image.
const AnnotatedImage: React.FC<{
  image: ImageWithAnnotations;
  onDelete: (annotationId: number, imageId: number) => void;
}> = ({ image, onDelete }) => {
  const theme = useTheme();
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<number | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      const setSize = () => {
        if (img.naturalWidth > 0) {
          setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        }
      };
      img.addEventListener('load', setSize);
      setSize(); // Call once in case image is already loaded
      return () => img.removeEventListener('load', setSize);
    }
  }, [image.storage_url]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4] } }}>
      <Box sx={{ position: 'relative', userSelect: 'none', height: 200, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img
          ref={imgRef}
          src={image.storage_url}
          alt={image.filepath}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
        {imgSize.w > 0 && (
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {image.annotations.map((anno) => {
              const isHovered = anno.id === hoveredAnnotationId;
              const color = isHovered ? theme.palette.error.main : theme.palette.success.main;
              return (
                <g
                  key={anno.id}
                  onMouseEnter={() => setHoveredAnnotationId(anno.id)}
                  onMouseLeave={() => setHoveredAnnotationId(null)}
                  style={{ pointerEvents: 'auto' }}
                >
                  <rect
                    x={anno.x * imgSize.w}
                    y={anno.y * imgSize.h}
                    width={anno.w * imgSize.w}
                    height={anno.h * imgSize.h}
                    stroke={color}
                    fill={isHovered ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.05)'}
                    strokeWidth={imgSize.w / 200} // Dynamic stroke width based on relative resolution
                  />
                </g>
              );
            })}
          </svg>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 1 }} title={image.filepath.split('/').pop()}>
          {image.filepath.split('/').pop()}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {image.annotations.map(anno => (
            <Box
              key={anno.id}
              onMouseEnter={() => setHoveredAnnotationId(anno.id)}
              onMouseLeave={() => setHoveredAnnotationId(null)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: hoveredAnnotationId === anno.id ? 'error.main' : 'action.selected',
                color: hoveredAnnotationId === anno.id ? 'white' : 'text.primary',
                px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 500,
                cursor: 'default',
                transition: 'all 0.2s'
              }}
            >
              {anno.tag}
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onDelete(anno.id, image.id); }}
                sx={{ ml: 0.5, p: 0, color: 'inherit', '&:hover': { color: 'white' } }}
              >
                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          ))}
          {image.annotations.length === 0 && (
            <Typography variant="caption" color="text.secondary">No annotations</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const AnnotatedImagesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageWithAnnotations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotatedImages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const imageListResponse = await getAnnotatedImages(Number(projectId), 1, 50); // Fetching up to 50
      const imageList = imageListResponse.data.images;

      if (!Array.isArray(imageList)) {
        throw new Error("Received invalid data from the server.");
      }
      if (imageList.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const imagePromises = imageList.map(async (image: AnnotatedImageInfo) => {
        const annotationsResponse = await getAnnotations(Number(projectId), image.id);
        return {
          ...image,
          annotations: annotationsResponse.data || [],
        };
      });

      const imagesWithAnnotations = await Promise.all(imagePromises);
      setImages(imagesWithAnnotations);

    } catch (err) {
      setError((err as Error).message || 'Failed to fetch annotated images.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAnnotatedImages();
  }, [fetchAnnotatedImages]);

  const handleDeleteAnnotation = async (annotationId: number, imageId: number) => {
    if (!projectId) return;
    try {
      await deleteAnnotation(Number(projectId), annotationId, imageId);
      fetchAnnotatedImages(); // Refetch all data to ensure consistency
    } catch (_err) {
      setError('Failed to delete annotation.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects`)}
          sx={{ mr: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          Back to Projects
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          Annotated Images
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage your dataset labels.
        </Typography>
      </Box>

      {images.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>No annotated images found in this project.</Alert>
      ) : (
        <Grid container spacing={3}>
          {images.map((image) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={image.id}>
              <AnnotatedImage image={image} onDelete={handleDeleteAnnotation} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AnnotatedImagesPage;

