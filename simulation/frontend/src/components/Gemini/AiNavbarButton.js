// Complete AINavbarButton.js
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
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
      <IconButton
        aria-label="AI Assistant"
        onClick={openAssistant}
        sx={{
          color: 'white', // Change to white for visibility on dark navbar
          padding: '8px',
          margin: '0 4px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <AIIcon 
          sx={{
            fontSize: 24,
            display: 'block'
          }}
        />
      </IconButton>
    </Tooltip>
  );
};

export default AINavbarButton;