import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import { getProjects, createProject, deleteProject } from '../services/api';

interface Project {
  id: number;
  name: string;
  description: string;
}

const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateProject = async () => {
    try {
      await createProject({ name: newProjectName, description: newProjectDescription });
      fetchProjects();
      handleClose();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project and all its data?')) {
      try {
        await deleteProject(projectId);
        fetchProjects();
      } catch (error) {
        console.error('Failed to delete project', error);
      }
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 6 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your computer vision datasets and models.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
        >
          Logout
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Create New Project Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px dashed #334155',
              backgroundColor: 'transparent',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
              },
            }}
            onClick={handleOpen}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Create New Project
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Cards */}
        {projects.map((project) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 700 }}>
                  {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {project.description || 'No description provided.'}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  variant="contained"
                  component={RouterLink}
                  to={`/projects/${project.id}/images`}
                >
                  Open
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteProject(project.id);
                  }}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={!newProjectName.trim()}>
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDashboard;
