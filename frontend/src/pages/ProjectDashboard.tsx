import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  ListItemButton,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Projects
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Create New Project
      </Button>
      <List>
        {projects.map((project) => (
          <ListItem
            key={project.id}
            disablePadding
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteProject(project.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton component={RouterLink} to={`/projects/${project.id}/images`}>
              <ListItemText primary={project.name} secondary={project.description} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create a new project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreateProject}>Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDashboard;
