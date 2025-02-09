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
  Chip
} from '@mui/material';
import { PlayArrow, Settings, BarChart } from '@mui/icons-material';

const MyProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4">
            My Projects
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/new-project')}
          >
            New Project
          </Button>
        </Box>

        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} key={project.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {project.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`Created: ${new Date(project.created_at).toLocaleDateString()}`}
                      size="small"
                    />
                    <Chip 
                      label={`Last updated: ${new Date(project.updated_at).toLocaleDateString()}`}
                      size="small"
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
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default MyProjects;