import React, { useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../services/api';

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      await api.post('/images/upload/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Images uploaded successfully!');
      setSelectedFiles(null);
      onUploadSuccess(); // Notify parent component to refresh images
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '2px dashed grey', borderRadius: '4px', textAlign: 'center' }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="raised-button-file"
        multiple
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
          Select Images
        </Button>
      </label>
      {selectedFiles && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">{selectedFiles.length} file(s) selected.</Typography>
          {Array.from(selectedFiles).map((file, index) => (
            <Typography key={index} variant="caption" display="block">{file.name}</Typography>
          ))}
        </Box>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFiles || selectedFiles.length === 0 || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Upload'}
      </Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Box>
  );
};

export default ImageUpload;
