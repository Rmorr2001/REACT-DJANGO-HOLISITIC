import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  PlayArrow,
  Settings,
  BarChart,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import EditProjectDialog from './EditProjectDialog.js';  // Add this at the top of MyProjects.js
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

const ProjectCard = ({ project, navigate, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" gutterBottom>
            {project.name}
          </Typography>
          <IconButton onClick={handleClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={() => {
              handleClose();
              onEdit(project);
            }}>
              <EditIcon sx={{ mr: 1 }} /> Edit
            </MenuItem>
            <MenuItem onClick={() => {
              handleClose();
              onDelete(project);
            }}>
              <DeleteIcon sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </Menu>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {project.description || 'No description'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`Created: ${formatDate(project.created_at)}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`Updated: ${formatDate(project.updated_at)}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          startIcon={<Settings />}
          onClick={() => navigate(`/projects/${project.id}/nodes`)}
        >
          Configure
        </Button>
        <Button 
          size="small" 
          startIcon={<PlayArrow />}
          onClick={() => navigate(`/projects/${project.id}/simulate`)}
        >
          Run
        </Button>
        <Button 
          size="small" 
          startIcon={<BarChart />}
          onClick={() => navigate(`/projects/${project.id}/results`)}
        >
          Results
        </Button>
      </CardActions>
    </Card>
  );
};

const MyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects/');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(prev => prev.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    ));
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" onClick={fetchProjects}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            <Typography variant="h4">
              My Projects
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={() => navigate('/new-project')}
          >
            New Project
          </Button>
        </Box>

        {projects.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No projects yet. Create your first project to get started!
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} md={6} key={project.id}>
                <ProjectCard 
                  project={project}
                  navigate={navigate}
                  onEdit={setEditingProject}
                  onDelete={handleDeleteProject}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <EditProjectDialog
        open={!!editingProject}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
      />
    </Container>
  );
};

export default MyProjects;