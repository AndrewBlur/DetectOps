import React, { useState, useCallback, useRef } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadBatchImages } from '../services/api';
import { useParams } from 'react-router-dom';

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      setError(null);
      setSuccess(null);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(event.dataTransfer.files));
      setError(null);
      setSuccess(null);
      event.dataTransfer.clearData();
    }
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    if (!projectId) {
        setError('Project ID is missing.');
        return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const fileList = new DataTransfer();
    selectedFiles.forEach(file => fileList.items.add(file));


    try {
      await uploadBatchImages(Number(projectId), fileList.files);
      setSuccess('Images uploaded successfully!');
      setSelectedFiles([]); // Clear selected files
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      onUploadSuccess(); // Notify parent component to refresh images
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 4,
        border: `2px dashed ${isDragOver ? 'primary.main' : 'grey'}`,
        borderRadius: '8px',
        textAlign: 'center',
        cursor: 'pointer',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.3s ease-in-out',
        backgroundColor: isDragOver ? 'rgba(0, 196, 159, 0.1)' : 'transparent',
      }}
    >
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="raised-button-file"
        multiple
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" startIcon={<CloudUploadIcon />} sx={{ mb: 2 }}>
          Select Images
        </Button>
      </label>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
        or Drag & Drop Images Here
      </Typography>
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2, maxHeight: '100px', overflowY: 'auto', width: '100%' }}>
          <Typography variant="body2" color="text.primary">{selectedFiles.length} file(s) selected:</Typography>
          {selectedFiles.map((file, index) => (
            <Typography key={index} variant="caption" display="block" color="text.secondary">{file.name}</Typography>
          ))}
        </Box>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Upload Selected'}
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
    </Box>
  );
};

export default ImageUpload;

