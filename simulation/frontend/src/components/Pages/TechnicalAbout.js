import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Code as CodeIcon,
  SmartToy,
  Layers,
  Speed,
  Psychology as PsychologyIcon,
  Api as ApiIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';

const TechnicalAbout = () => {
  const navigate = useNavigate();
  
  // Ensure scrolling is enabled
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Changing navbar color for this page
  useEffect(() => {
    // Get navbar element
    const navbar = document.querySelector('.MuiAppBar-root');
    
    // Store original background color to restore later
    const originalBgColor = navbar ? navbar.style.backgroundColor : null;
    
    // Change navbar color to match the blue theme of homepage
    if (navbar) {
      navbar.style.backgroundColor = '#1976d2';
    }
    
    // Restore original styling when component unmounts
    return () => {
      if (navbar) {
        navbar.style.backgroundColor = originalBgColor || '#041E6A';
      }
    };
  }, []);
  
  return (
    <Box sx={{ 
      bgcolor: '#f8f9fa', 
      width: '100%',
      position: 'relative',
      overflow: 'visible',
    }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: '#1976d2',
          color: 'white',
          py: 6,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                Technical Overview
              </Typography>
              
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                SimpleTalk is built using the CIW Python library and Google's Gemini API
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                height: { xs: 200, md: 250 },
                position: 'relative'
              }}>
                <CodeIcon sx={{ fontSize: 80, opacity: 0.9 }} />
                <SmartToy sx={{ fontSize: 80, ml: -2, mt: -2, opacity: 0.9 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CIW Library Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          CIW Python Library
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
          An open-source discrete event simulation library
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Layers sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                <Typography variant="h5">Simulation Framework</Typography>
              </Box>
              <Typography paragraph>
                CIW (Ciw) is a discrete event simulation library built in Python that models queueing networks. In SimpleTalk, it handles the mathematical calculations for simulating queues and service points.
              </Typography>
              <Typography paragraph>
                The library manages arrival time distributions, service durations, resource allocation, and customer flow through service networks. This allows for accurate prediction of metrics like average wait times, resource utilization, and system throughput.
              </Typography>
              <Typography>
                CIW was developed as an academic project and follows established queueing theory principles. It's particularly well-suited for service operation simulations like those found in restaurants, retail, healthcare, and transportation.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  Core Capabilities
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ flexGrow: 1 }}>
                  <ListItem>
                    <ListItemIcon><Speed sx={{ color: '#1976d2' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Network Modeling" 
                      secondary="Simulates connected service points with different characteristics"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed sx={{ color: '#1976d2' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Distribution Support" 
                      secondary="Includes exponential, uniform, deterministic, and empirical distributions"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed sx={{ color: '#1976d2' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Data Collection" 
                      secondary="Records wait times, service times, queue lengths, and resource utilization"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Speed sx={{ color: '#1976d2' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Simulation Runs" 
                      secondary="Supports multiple trials for statistical significance"
                    />
                  </ListItem>
                </List>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    startIcon={<GitHubIcon />}
                    href="https://github.com/CiwPython/Ciw"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Repository
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Gemini API Section */}
      <Box sx={{ bgcolor: '#f0f4f8', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Gemini API Integration
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
            Natural language processing to configure simulations
          </Typography>

          <Paper sx={{ p: 4, mb: 5 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <PsychologyIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                  <Typography variant="h5">Language Processing</Typography>
                </Box>
                <Typography paragraph>
                  SimpleTalk uses Google's Gemini API to process natural language descriptions of business scenarios. This allows users to describe their service operations without needing to understand simulation terminology.
                </Typography>
                <Typography paragraph>
                  When a user describes their business setup (e.g., "a restaurant with 3 servers who each take about 5-7 minutes to serve a customer"), Gemini extracts the relevant parameters needed for the CIW simulation.
                </Typography>
                <Typography>
                  This approach reduces the technical barrier to using simulation software, as users can communicate in business terms rather than programming or mathematical notation.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <ApiIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                  <Typography variant="h5">Implementation Details</Typography>
                </Box>
                <Typography paragraph>
                  The application makes API calls to Gemini with structured prompts that guide the model to extract specific parameters: arrival rates, service times, resource counts, routing probabilities, and other simulation-relevant data.
                </Typography>
                <Typography paragraph>
                  Gemini processes the user input and returns structured data that's then used to configure the CIW simulation model. The system also validates the extracted parameters to ensure they're within reasonable ranges for simulation.
                </Typography>
                <Typography>
                  In addition to initial setup, Gemini helps explain simulation results by translating technical metrics into business-relevant insights and recommendations.
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ 
                    height: 60, 
                    width: 60, 
                    bgcolor: '#1976d2', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    mb: 2,
                  }}>
                    <Typography variant="h5">1</Typography>
                  </Box>
                  <Typography gutterBottom variant="h6" component="h3">
                    User Input
                  </Typography>
                  <Typography color="text.secondary">
                    Business description provided in plain language
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ 
                    height: 60, 
                    width: 60, 
                    bgcolor: '#1976d2', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    mb: 2,
                  }}>
                    <Typography variant="h5">2</Typography>
                  </Box>
                  <Typography gutterBottom variant="h6" component="h3">
                    Parameter Extraction
                  </Typography>
                  <Typography color="text.secondary">
                    Gemini identifies arrival rates, service times, and resources
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                  <Box sx={{ 
                    height: 60, 
                    width: 60, 
                    bgcolor: '#1976d2', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    mb: 2,
                  }}>
                    <Typography variant="h5">3</Typography>
                  </Box>
                  <Typography gutterBottom variant="h6" component="h3">
                    Simulation Configuration
                  </Typography>
                  <Typography color="text.secondary">
                    Parameters configure CIW simulation network model
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Development Status */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Current Development Status
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
          SimpleTalk is currently in beta (v0.1)
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Implemented Features
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Basic queue modeling" secondary="Single and multi-server queues with standard distributions" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Natural language configuration" secondary="Setup simulation parameters through conversation" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Results visualization" secondary="Basic charts and metrics for simulation outcomes" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Project saving" secondary="Store and retrieve simulation configurations" />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Planned Enhancements
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Advanced network topologies" secondary="More complex service flows and decision points" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Time-varying parameters" secondary="Support for changing arrival rates throughout the day" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Additional distributions" secondary="More statistical options for modeling real-world variability" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>✓</ListItemIcon>
                  <ListItemText primary="Comparative analysis" secondary="Side-by-side comparison of different configurations" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: '#e3f2fd', py: 6 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Try SimpleTalk
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            Create a simulation project to model your service operation
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            color="primary"
            onClick={() => navigate('/new-project')}
            sx={{ px: 4, py: 1.5, mr: 2 }}
          >
            New Project
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            color="primary"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#041E6A', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                SimpleTalk
              </Typography>
              <Typography variant="body2">
                Queue simulation software for practical business applications
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Box>
                <Button color="inherit" onClick={() => navigate('/about')}>
                  About the Developer
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', mt: 3, pt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              © {new Date().getFullYear()} SimpleTalk. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default TechnicalAbout;