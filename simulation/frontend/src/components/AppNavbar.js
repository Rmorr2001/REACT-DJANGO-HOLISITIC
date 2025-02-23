import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ExpandMore } from '@mui/icons-material';

const AppNavbar = ({ aiButton }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [aboutMenu, setAboutMenu] = React.useState(null);

  const handleAboutClick = (event) => {
    setAboutMenu(event.currentTarget);
  };

  const handleAboutClose = () => {
    setAboutMenu(null);
  };

  return (
    <AppBar 
      position="sticky" // Ensures navbar stays at the top while scrolling
      sx={{ 
        top: 0,
        zIndex: 1100, // Ensures it stays above other elements
        backgroundColor: '#041E6A', 
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Typography
          variant={isMobile ? "h6" : "h5"}
          component={RouterLink}
          to="/"
          sx={{
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold',
            flexGrow: 0
          }}
        >
          SimpleTalk - BETA 0.2
        </Typography>

        {/* AI Button next to the logo */}
        {aiButton}
        
        {/* Space between logo and navigation links */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Navigation Links */}
        <Box sx={{ display: 'flex' }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/new-project"
            sx={{ mx: 0.5 }}
          >
            New Project
          </Button>
          
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/projects"
            sx={{ mx: 0.5 }}
          >
            My Projects
          </Button>
          
          <Button 
            color="inherit"
            sx={{ mx: 0.5 }}
            onClick={handleAboutClick}
            endIcon={<ExpandMore />}
          >
            About
          </Button>
          <Menu
            anchorEl={aboutMenu}
            open={Boolean(aboutMenu)}
            onClose={handleAboutClose}
          >
            <MenuItem 
              component={RouterLink} 
              to="/about"
              onClick={handleAboutClose}
            >
              Developer
            </MenuItem>
            <MenuItem 
              component={RouterLink} 
              to="/technical-about"
              onClick={handleAboutClose}
            >
              Technology
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppNavbar;