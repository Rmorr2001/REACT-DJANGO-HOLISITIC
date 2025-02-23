import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { useAIAssistant } from './AIAssistantContext.js';
import { useLocation } from 'react-router-dom';

const AINavbarButton = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  
  // Create a fallback in case context is not available
  const defaultOpenAssistant = () => {
    console.warn('openAssistant not available, using fallback');
    alert('AI Assistant is not available at the moment.');
  };
  
  // Use a try-catch to prevent errors if the context is not ready
  let openAssistant = defaultOpenAssistant;
  try {
    const context = useAIAssistant();
    if (context && typeof context.openAssistant === 'function') {
      openAssistant = context.openAssistant;
    }
  } catch (error) {
    console.error("Error accessing AI Assistant context:", error);
  }

  return (
    <Tooltip title="AI Assistant" placement="bottom">
      <Button
        variant="contained"
        onClick={openAssistant}
        sx={{
          backgroundColor: isAboutPage ? '#D4AF37' : '#0A2B6A',
          color: isAboutPage ? '#111111' : 'white',
          padding: '8px 16px',
          margin: '0 4px',
          '&:hover': {
            backgroundColor: isAboutPage ? '#F4C460' : '#0B3A8C',
          },
          border: isAboutPage ? '1px solid #111111' : 'none',
          transition: 'all 0.3s ease',
        }}
        startIcon={<AIIcon />}
      >
        Talk to Me
      </Button>
    </Tooltip>
  );
};

export default AINavbarButton;