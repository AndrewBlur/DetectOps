import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
    Slider,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Link,
    Stack,
    LinearProgress,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getDatasets, createDataset, getDatasetExportStatus, deleteDataset } from '../services/api';

interface Dataset {
    id: number;
    version: number;
    zip_url: string;
    classes: string[];
    train_split: number;
    val_split: number;
    test_split: number;
    created_at: string | null;
}

interface TaskProgress {
    current: number;
    total: number;
    phase: string;
    message: string;
}

const DatasetsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [progress, setProgress] = useState<TaskProgress | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Split values (percentages 0-100)
    const [trainSplit, setTrainSplit] = useState(70);
    const [valSplit, setValSplit] = useState(15);
    const [testSplit, setTestSplit] = useState(15);

    const fetchDatasets = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await getDatasets(Number(projectId));
            setDatasets(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch datasets');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchDatasets();
    }, [fetchDatasets]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const pollTaskStatus = useCallback(async (tid: string) => {
        if (!projectId) return;

        try {
            const response = await getDatasetExportStatus(tid);
            const { state, result } = response.data;

            if (state === 'PROGRESS') {
                setProgress(result);
            } else if (state === 'SUCCESS') {
                // Task completed
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                setTaskId(null);
                setProgress(null);
                setCreating(false);

                if (result?.status === 'success') {
                    setSuccess(`Dataset v${result.version} created successfully!`);
                    fetchDatasets();
                } else if (result?.status === 'error') {
                    setError(result.message || 'Dataset export failed');
                }
            } else if (state === 'FAILURE') {
                // Task failed
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                setTaskId(null);
                setProgress(null);
                setCreating(false);
                setError('Dataset export failed');
            }
        } catch (err: any) {
            console.error('Error polling task status:', err);
        }
    }, [projectId, fetchDatasets]);

    const handleTrainChange = (_: Event, value: number | number[]) => {
        const newTrain = value as number;
        const remaining = 100 - newTrain;
        const ratio = valSplit / (valSplit + testSplit) || 0.5;
        setTrainSplit(newTrain);
        setValSplit(Math.round(remaining * ratio));
        setTestSplit(Math.round(remaining * (1 - ratio)));
    };

    const handleValChange = (_: Event, value: number | number[]) => {
        const newVal = value as number;
        const maxVal = 100 - trainSplit;
        const clampedVal = Math.min(newVal, maxVal);
        setValSplit(clampedVal);
        setTestSplit(100 - trainSplit - clampedVal);
    };

    const handleCreateDataset = async () => {
        if (!projectId) return;
        setCreating(true);
        setError(null);
        setSuccess(null);
        setProgress(null);

        try {
            const response = await createDataset(
                Number(projectId),
                trainSplit / 100,
                valSplit / 100,
                testSplit / 100
            );

            const tid = response.data.task_id;
            setTaskId(tid);

            // Start polling for status
            pollingRef.current = setInterval(() => {
                pollTaskStatus(tid);
            }, 1000);

            // Initial poll
            pollTaskStatus(tid);

        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to start dataset export');
            setCreating(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const splitsValid = trainSplit + valSplit + testSplit === 100;
    const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

    const handleDeleteDataset = async (datasetId: number) => {
        if (!projectId) return;
        if (!window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDataset(Number(projectId), datasetId);
            setSuccess('Dataset deleted successfully');
            fetchDatasets();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete dataset');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                    Datasets
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create and manage YOLO-format datasets for model training.
                </Typography>
            </Box>

            {/* Create Dataset Card */}
            <Card sx={{ mb: 4, p: 2 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Create New Dataset
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography gutterBottom>
                            Train Split: <strong>{trainSplit}%</strong>
                        </Typography>
                        <Slider
                            value={trainSplit}
                            onChange={handleTrainChange}
                            min={10}
                            max={90}
                            valueLabelDisplay="auto"
                            sx={{ maxWidth: 400 }}
                            disabled={creating}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography gutterBottom>
                            Validation Split: <strong>{valSplit}%</strong>
                        </Typography>
                        <Slider
                            value={valSplit}
                            onChange={handleValChange}
                            min={0}
                            max={100 - trainSplit}
                            valueLabelDisplay="auto"
                            sx={{ maxWidth: 400 }}
                            disabled={creating}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography gutterBottom>
                            Test Split: <strong>{testSplit}%</strong>
                        </Typography>
                        <Slider value={testSplit} disabled sx={{ maxWidth: 400 }} />
                    </Box>

                    {/* Progress Bar */}
                    {creating && progress && (
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {progress.phase}: {progress.message}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {progress.current} / {progress.total}
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                    )}

                    {creating && !progress && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Starting export...
                            </Typography>
                            <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                    )}

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            variant="contained"
                            startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                            onClick={handleCreateDataset}
                            disabled={!splitsValid || creating}
                        >
                            {creating ? 'Exporting...' : 'Create Dataset'}
                        </Button>
                        {!splitsValid && (
                            <Typography color="error" variant="body2">
                                Splits must sum to 100%
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Datasets Table */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Existing Datasets
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : datasets.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No datasets created yet. Create your first dataset above.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Version</TableCell>
                                <TableCell>Splits (Train/Val/Test)</TableCell>
                                <TableCell>Classes</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {datasets.map((dataset) => (
                                <TableRow key={dataset.id}>
                                    <TableCell>
                                        <Typography fontWeight={600}>v{dataset.version}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {Math.round(dataset.train_split * 100)}% / {Math.round(dataset.val_split * 100)}% / {Math.round(dataset.test_split * 100)}%
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                            {dataset.classes.slice(0, 5).map((cls) => (
                                                <Chip key={cls} label={cls} size="small" variant="outlined" />
                                            ))}
                                            {dataset.classes.length > 5 && (
                                                <Chip label={`+${dataset.classes.length - 5}`} size="small" />
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{formatDate(dataset.created_at)}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button
                                                component={Link}
                                                href={dataset.zip_url}
                                                target="_blank"
                                                startIcon={<DownloadIcon />}
                                                size="small"
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                size="small"
                                                onClick={() => handleDeleteDataset(dataset.id)}
                                            >
                                                Delete
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default DatasetsPage;
