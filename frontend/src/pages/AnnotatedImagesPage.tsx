import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, CircularProgress, Alert, Grid, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAnnotatedImages, getAnnotations, deleteAnnotation } from '../services/api';
import { useParams } from 'react-router-dom';

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

// A new component to display a single annotated image.
const AnnotatedImage: React.FC<{
  image: ImageWithAnnotations;
  onDelete: (annotationId: number, imageId: number) => void;
}> = ({ image, onDelete }) => {
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = React.useRef<HTMLImageElement | null>(null);
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
    <Box sx={{ position: 'relative', userSelect: 'none', height: 250, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
                  stroke={isHovered ? 'red' : 'lime'}
                  fill={isHovered ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)'}
                  strokeWidth={2}
                />
                <text
                  x={anno.x * imgSize.w + 5}
                  y={anno.y * imgSize.h + 20}
                  fontSize={20}
                  fill={isHovered ? 'red' : 'lime'}
                  style={{ filter: 'drop-shadow(0px 0px 2px #000)' }}
                >
                  {anno.tag}
                </text>
                {isHovered && (
                  <foreignObject
                    x={anno.x * imgSize.w + anno.w * imgSize.w - 30}
                    y={anno.y * imgSize.h + 5}
                    width="25"
                    height="25"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); onDelete(anno.id, image.id); }}
                      sx={{ background: 'rgba(0,0,0,0.7)', padding: '2px' }}
                    >
                      <DeleteIcon fontSize="small" sx={{ color: 'red' }} />
                    </IconButton>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </Box>
  );
};

const AnnotatedImagesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [images, setImages] = useState<ImageWithAnnotations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotatedImages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const imageListResponse = await getAnnotatedImages(Number(projectId), 1, 50); // Fetching up to 50, pagination can be added here
      const imageList = imageListResponse.data.images;

      if (!Array.isArray(imageList)) {
        throw new Error("Received invalid data from the server.");
      }
      if (imageList.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const imagePromises = imageList.map(async (image) => {
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Annotated Images
      </Typography>
      {images.length === 0 ? (
        <Alert severity="info">No annotated images found in this project.</Alert>
      ) : (
        <Grid container spacing={4}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image.id}>
              <AnnotatedImage image={image} onDelete={handleDeleteAnnotation} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AnnotatedImagesPage;

