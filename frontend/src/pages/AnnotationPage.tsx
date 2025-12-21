import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import api from '../services/api';
import { Annotator, type BoxType } from '../components/Annotator';

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

// Map from imageId to its annotations
type AnnotationsMap = {
  [imageId: number]: BoxType[];
};

const AnnotationPage: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [allAnnotations, setAllAnnotations] = useState<AnnotationsMap>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);


  const fetchUnannotatedImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all pages of unannotated images
      let allImages: Image[] = [];
      let page = 1;
      let total = 0;
      const pageSize = 50; // Fetch 50 at a time

      do {
        const response = await api.get<PaginatedImageResponse>('/images/mine', {
          params: { page, page_size: pageSize },
        });
        allImages = [...allImages, ...response.data.images];
        total = response.data.total;
        page++;
      } while (allImages.length < total);
      
      setImages(allImages);
      // Initialize annotations map
      const initialAnnotations: AnnotationsMap = {};
      for (const image of allImages) {
        initialAnnotations[image.id] = [];
      }
      setAllAnnotations(initialAnnotations);

    } catch (err) {
      setError((err as Error).message || 'Failed to fetch images for annotation.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get<string[]>('/annotations/tags');
      setExistingTags(response.data);
    } catch (err) {
      console.error("Could not fetch existing tags", err);
      // Non-fatal, user can still type tags
    }
  }, []);

  useEffect(() => {
    fetchUnannotatedImages();
    fetchTags();
  }, [fetchUnannotatedImages, fetchTags]);



  const handleBoxesChange = (boxes: BoxType[]) => {
    const imageId = images[currentImageIndex].id;
    setAllAnnotations(prev => ({
      ...prev,
      [imageId]: boxes,
    }));
  };

  const handleNewTag = (tag: string) => {
    setExistingTags(prev => [...prev, tag]);
  }

  const goToNext = () => {
    setCurrentImageIndex(i => Math.min(i + 1, images.length - 1));
  };

  const goToPrev = () => {
    setCurrentImageIndex(i => Math.max(0, i - 1));
  };
  
  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    setError(null);
    setSubmitSuccess(null);

    const annotationPromises: Promise<void>[] = [];

    for (const imageId in allAnnotations) {
      const boxes = allAnnotations[imageId];
      if (boxes.length > 0) {
        for (const box of boxes) {
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
          annotationPromises.push(api.post('/annotations', payload));
        }
      }
    }

    if (annotationPromises.length === 0) {
      setError("No annotations to submit.");
      setIsSubmitting(false);
      return;
    }

    try {
      await Promise.all(annotationPromises);
      setSubmitSuccess("All annotations submitted successfully!");
      // Refetch to clear the list and refresh tags
      fetchUnannotatedImages();
      fetchTags();
      setCurrentImageIndex(0);

    } catch (err) {
      setError((err as Error).message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const currentImage = images[currentImageIndex];
  const currentBoxes = currentImage ? allAnnotations[currentImage.id] : [];

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

  if (images.length === 0) {
    return (
        <Container sx={{ mt: 4 }}>
            <Alert severity="info">No images to annotate.</Alert>
        </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
            Annotate Images ({currentImageIndex + 1} of {images.length})
        </Typography>

        {submitSuccess && <Alert severity="success" sx={{mb: 2}}>{submitSuccess}</Alert>}

        {currentImage && (
            <Annotator
                key={currentImage.id} // Important to re-mount the component for a new image
                imageUrl={currentImage.storage_url}
                boxes={currentBoxes}
                onBoxesChange={handleBoxesChange}
                existingTags={existingTags}
                onNewTag={handleNewTag}
            />
        )}



        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
            <Button variant="outlined" onClick={goToPrev} disabled={currentImageIndex <= 0}>
                Previous
            </Button>
            <Button variant="outlined" onClick={goToNext} disabled={currentImageIndex >= images.length - 1}>
                Next
            </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmitAll}
                disabled={isSubmitting || Object.values(allAnnotations).every(b => b.length === 0)}
            >
                {isSubmitting ? <CircularProgress size={24} /> : 'Submit All Annotations'}
            </Button>
        </Box>

    </Container>
  );
};

export default AnnotationPage;
