// Complete AINavbarButton.js
import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { useAIAssistant } from './AIAssistantContext.js';

const AINavbarButton = () => {
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

  // Use white color to contrast with your dark navbar (#041E6A)
  return (
    <Tooltip title="AI Assistant" placement="bottom">
      <Button
        variant="contained"
        onClick={openAssistant}
        sx={{
          backgroundColor: '#0A2B6A', // Lighter shade than the navbar
          color: 'white',
          padding: '8px 16px',
          margin: '0 4px',
          '&:hover': {
            backgroundColor: '#0B3A8C', // Slightly lighter on hover
          }
        }}
        startIcon={<AIIcon />}
      >
        Talk to Me
      </Button>
    </Tooltip>
  );
};

export default AINavbarButton;