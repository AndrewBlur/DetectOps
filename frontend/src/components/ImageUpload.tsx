import React, { useState, useCallback, useRef } from 'react';
import { Button, Box, Typography, Alert, CircularProgress, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadBatchImages, getTaskStatusStreamUrl } from '../services/api';
import { useParams } from 'react-router-dom';

interface ImageUploadProps {
  onUploadSuccess: () => void;
}

interface UploadProgress {
  current: number;
  total: number;
  message: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadSuccess }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

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
    setUploadProgress({ current: 0, total: selectedFiles.length, message: 'Starting upload...' });

    const fileList = new DataTransfer();
    selectedFiles.forEach(file => fileList.items.add(file));

    try {
      const response = await uploadBatchImages(Number(projectId), fileList.files);
      const taskId = response.data.task_id;

      if (taskId) {
        // Connect to SSE stream for real-time updates
        const streamUrl = getTaskStatusStreamUrl(taskId);
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.addEventListener('status', (event) => {
          const data = JSON.parse(event.data);

          if (data.state === 'PROGRESS' && data.result) {
            setUploadProgress({
              current: data.result.current || 0,
              total: data.result.total || selectedFiles.length,
              message: data.result.message || 'Uploading...'
            });
          } else if (data.state === 'SUCCESS') {
            eventSource.close();
            setLoading(false);
            setSuccess('All images uploaded successfully!');
            setUploadProgress(null);
            setSelectedFiles([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            onUploadSuccess(); // Auto-refresh the image list!
          } else if (data.state === 'FAILURE') {
            eventSource.close();
            setLoading(false);
            setError(data.result?.message || 'Upload failed. Please try again.');
            setUploadProgress(null);
          }
        });

        eventSource.onerror = () => {
          eventSource.close();
          setLoading(false);
          setError('Connection lost. Please refresh and try again.');
          setUploadProgress(null);
        };
      } else {
        // Fallback if no task_id (shouldn't happen)
        setSuccess('Images uploaded successfully!');
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onUploadSuccess();
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload images.');
      setLoading(false);
      setUploadProgress(null);
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
      {uploadProgress && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {uploadProgress.message} ({uploadProgress.current}/{uploadProgress.total})
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(uploadProgress.current / uploadProgress.total) * 100}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}
    </Box>
  );
};

export default ImageUpload;

