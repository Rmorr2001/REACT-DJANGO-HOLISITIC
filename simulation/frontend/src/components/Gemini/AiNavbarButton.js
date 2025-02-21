import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { useAIAssistant } from './AppGeminiAssistant.js';

const AINavbarButton = () => {
  const { openAssistant } = useAIAssistant();

  return (
    <Tooltip title="AI Assistant" placement="bottom">
      <IconButton
        aria-label="AI Assistant"
        onClick={openAssistant}
        sx={{
          color: '#041E6A',
          '&:hover': {
            backgroundColor: 'rgba(4, 30, 106, 0.08)',
          }
        }}
      >
        <AIIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AINavbarButton;