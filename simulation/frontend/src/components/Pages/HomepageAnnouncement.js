import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Container,
  IconButton,
  Collapse,
  Button
} from '@mui/material';
import { 
  Close as CloseIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const HomepageAnnouncement = () => {
  const [open, setOpen] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  if (!open) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 0 }}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          background: 'linear-gradient(to right, rgba(37, 99, 235, 0.03), rgba(37, 99, 235, 0.07))'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          p: 2,
          position: 'relative'
        }}>
          <InfoIcon 
            sx={{ 
              color: '#2563EB', 
              mr: 2, 
              mt: 0.5,
              opacity: 0.9 
            }} 
          />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600, 
                color: '#2563EB',
                mb: 0.5
              }}
            >
              Demo Deployment
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              Welcome to SimpleTalk! This is a demonstration deployment created as a masters project. Some features may have limited functionality.
            </Typography>
            
            <Collapse in={showDetails}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, color: '#1e3a8a' }}>
                    About this demonstration:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        This simulation tool demonstrates queueing theory concepts through an accessible interface.
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>For the best experience, use the "Talk to Me" button</strong> in the navbar for full AI assistant functionality.
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        The embedded AI assistant integrates with Google's Gemini API to help configure simulations.
                      </Typography>
                    </Box>
                    <Box component="li">
                      <Typography variant="body2">
                        This is a non-commercial educational project. Data may be reset periodically.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Collapse>
            
            <Button
              variant="text"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ 
                mt: 1, 
                color: '#2563EB',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.08)'
                }
              }}
            >
              {showDetails ? 'Show less' : 'Learn more'}
            </Button>
          </Box>
          
          <IconButton 
            size="small" 
            onClick={() => setOpen(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Container>
  );
};

export default HomepageAnnouncement;