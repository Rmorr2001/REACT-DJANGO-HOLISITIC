import React from "react";
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
  Restaurant, 
  Store, 
  LocalHospital, 
  School,
  DirectionsBus,
  PlayArrow, 
  Assessment,
} from '@mui/icons-material';
import HomepageChatPreview from './HomepageChatPreview.js';

function HomePage() {
  const navigate = useNavigate();
  
  // Ensure scrolling is enabled
  React.useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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
          bgcolor: '#2563EB',
          color: 'white',
          py: 6,
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            {/* Left side content - reduced to 1/3 of the space */}
            <Grid item xs={12} md={4}>
              <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                SimpleTalk
              </Typography>
              
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Simulations for restaurants, stores, and service facilities simply by talking.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  color="info"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/new-project')}
                  sx={{ fontWeight: 'bold', px: 3, bgcolor: 'white', color: '#1976d2' }}
                >
                  New Project
                </Button>
                
                <Button
                  variant="outlined"
                  size="large" 
                  color="inherit"
                  startIcon={<Assessment />}
                  onClick={() => navigate('/projects')}
                  sx={{ fontWeight: 'bold' }}
                >
                  My Projects
                </Button>
              </Box>
            </Grid>
            
            {/* Right side chat - expanded to 2/3 of the space */}
            <Grid item xs={12} md={8} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ height: 360 }}>
                <HomepageChatPreview />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Use Cases Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Perfect for Everyday Simulations
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
          Designed for practical, real-world applications without unnecessary complexity
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Restaurant sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h3">
                  Restaurants
                </Typography>
                <Typography color="text.secondary">
                  Model customer arrivals, seating efficiency, and service times to optimize your restaurant layout and staffing.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Store sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h3">
                  Retail Stores
                </Typography>
                <Typography color="text.secondary">
                  Simulate checkout lines, customer flow, and peak hours to improve customer experience and reduce wait times.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <LocalHospital sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h3">
                  Medical Clinics
                </Typography>
                <Typography color="text.secondary">
                  Model patient arrivals, waiting rooms, and appointment schedules to reduce congestion and improve patient flow.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <School sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h3">
                  Educational Settings
                </Typography>
                <Typography color="text.secondary">
                  Simulate student registration lines, cafeteria traffic, and classroom transitions to improve campus efficiency.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <DirectionsBus sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography gutterBottom variant="h5" component="h3">
                  Transportation
                </Typography>
                <Typography color="text.secondary">
                  Model bus stops, ticket lines, and passenger boarding to optimize schedules and reduce congestion.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                <Box sx={{ 
                  height: 48, 
                  width: 48, 
                  bgcolor: '#1976d2', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  mb: 2,
                  fontSize: 24,
                }}>+</Box>
                <Typography gutterBottom variant="h5" component="h3">
                  And More
                </Typography>
                <Typography color="text.secondary">
                  Any service system with queues can be modeled with our straightforward tools and templates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#f0f4f8', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Simple but Powerful Features
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
            Everything you need without overwhelming complexity
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  For Business Owners & Managers
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Easy-to-use interface with no coding required" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Simulation customization" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Visual results that are easy to understand and share" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Practical recommendations for improving efficiency" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Compare different layouts and staffing models" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  For Students & Educators
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Perfect for teaching queueing theory fundamentals" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Visualize concepts like arrival distribution and service times" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Create and share classroom assignments" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>✓</ListItemIcon>
                    <ListItemText primary="Compare theoretical models with simulation results" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

       {/* How It Works Section */}
       <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          How It Works
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5 }}>
          Three simple steps to better service efficiency
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                bgcolor: '#1976d2', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                mb: 2
              }}>1</Box>
              <Typography variant="h6" gutterBottom>Create a New Project</Typography>
              <Typography color="text.secondary">
                Choose from templates or start from scratch with your own custom scenario
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                bgcolor: '#1976d2', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                mb: 2
              }}>2</Box>
              <Typography variant="h6" gutterBottom>Configure Your Model</Typography>
              <Typography color="text.secondary">
                Set up arrival patterns, service times, and resources using our intuitive interface
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ 
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                bgcolor: '#1976d2', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                mb: 2
              }}>3</Box>
              <Typography variant="h6" gutterBottom>Run & Analyze</Typography>
              <Typography color="text.secondary">
                Execute your simulation and review key metrics and recommendations to improve efficiency
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/new-project')}
            sx={{ px: 4, py: 1.5, bgcolor: '#1976d2' }}
          >
            Start a New Project
          </Button>
        </Box>
      </Container>

      {/* Testimonial/Social Proof (Optional) */}
      <Box sx={{ bgcolor: '#e3f2fd', py: 6 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="p" sx={{ fontStyle: 'italic', mb: 3 }}>
            "SimpleTalk is like having an engineer, a teacher, <br />
            and a simulation software wrapped in one package!"
          </Typography>
          <Typography variant="subtitle1" component="p" fontWeight="bold">
            — RJ Morrison, Developer
          </Typography>
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
                Simple, practical queueing simulations for everyday service operations.
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
}

export default HomePage;