import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getImage, getAnnotations, createAnnotation, getTags, deleteAnnotation, getImages } from '../services/api';
import { Annotator, type BoxType } from '../components/Annotator';

interface Image {
  id: number;
  filepath: string;
  storage_url: string;
}

const AnnotationPage: React.FC = () => {
  const { projectId, imageId } = useParams<{ projectId: string; imageId: string }>();
  const navigate = useNavigate();

  const [image, setImage] = useState<Image | null>(null);
  const [boxes, setBoxes] = useState<BoxType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!projectId || !imageId) return;
    setLoading(true);
    setError(null);
    try {
      const [imageResponse, annotationsResponse, tagsResponse] = await Promise.all([
        getImage(Number(projectId), Number(imageId)),
        getAnnotations(Number(projectId), Number(imageId)),
        getTags(Number(projectId)),
      ]);

      setImage(imageResponse.data);
      setBoxes(annotationsResponse.data.map(anno => ({
        x: anno.x,
        y: anno.y,
        w: anno.w,
        h: anno.h,
        tag: anno.tag,
      })));
      setExistingTags(tagsResponse.data);

    } catch (err) {
      setError((err as Error).message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [projectId, imageId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBoxesChange = (newBoxes: BoxType[]) => {
    setBoxes(newBoxes);
  };

  const handleNewTag = (tag: string) => {
    setExistingTags(prev => [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!projectId || !imageId) return;

    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    try {
      // First, delete all existing annotations for this image
      const existingAnnotations = await getAnnotations(Number(projectId), Number(imageId));
      await Promise.all(
        existingAnnotations.data.map(anno =>
          deleteAnnotation(Number(projectId), anno.id, Number(imageId))
        )
      );

      // Then, create all the new annotations
      const annotationPromises = boxes.map(box => {
        const payload = {
          image_id: Number(imageId),
          annotation: {
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
            tag: box.tag || 'untagged',
          },
        };
        return createAnnotation(Number(projectId), payload);
      });

      if (annotationPromises.length === 0) {
        // This means we just cleared the annotations
        setSubmitSuccess("All annotations for this image have been cleared.");
        setTimeout(() => navigate(`/projects/${projectId}/images`), 1500);
      } else {
        await Promise.all(annotationPromises);

        // Fetch the next image to annotate
        const nextImagesResponse = await getImages(Number(projectId), 1, 1);
        if (nextImagesResponse.data.images.length > 0) {
          const nextImageId = nextImagesResponse.data.images[0].id;
          setSubmitSuccess("Annotations submitted successfully! Loading next image...");
          setTimeout(() => {
            navigate(`/projects/${projectId}/images/${nextImageId}/annotate`);
            // Force a reload of the component since we are navigating to the same route with different params
            // React Router 6 handles this by just updating the params, so the useEffect hook with [projectId, imageId] dependency handles data fetching.
            // However, we need to reset component state for the new image.
            setBoxes([]);
            setImage(null);
            setSubmitSuccess(null);
          }, 1000);
        } else {
          setSubmitSuccess("All images annotated!");
          setTimeout(() => navigate(`/projects/${projectId}/images`), 1500);
        }
      }

    } catch (err) {
      setError((err as Error).message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!image) {
    return <Container sx={{ mt: 4 }}><Alert severity="info">Image not found.</Alert></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Annotate Image
      </Typography>

      {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}

      <Annotator
        key={image.id}
        imageUrl={image.storage_url}
        boxes={boxes}
        onBoxesChange={handleBoxesChange}
        existingTags={existingTags}
        onNewTag={handleNewTag}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Save Annotations'}
        </Button>
      </Box>
    </Container>
  );
};

export default AnnotationPage;

