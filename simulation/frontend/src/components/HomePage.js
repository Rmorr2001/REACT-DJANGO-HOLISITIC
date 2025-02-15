// HomePage.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NewProject from "./NewProject.js";
import MyProjects from "./MyProjects.js";
import NodeConfiguration from "./SimConfig/NodeConfiguration.js";
import Dashboard from "./Dashboard.js";

function Home() {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 4,
        py: 8 
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Simulation Management System
        </Typography>
        
        <Typography variant="h5" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Create, configure and analyze queuing network simulations
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/new-project')}
          >
            Create New Project
          </Button>
          
          <Button
            variant="outlined"
            size="large" 
            onClick={() => navigate('/projects')}
          >
            View My Projects
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function HomePage() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-project" element={<NewProject />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/projects/:projectId/nodes" element={<NodeConfiguration />} />
          <Route path="/projects/:projectId/simulate" element={<Dashboard />} />
          <Route path="/projects/:projectId/results" element={<Dashboard mode="results" />} />
        </Routes>
      </Router>
  );
}

export default HomePage;



