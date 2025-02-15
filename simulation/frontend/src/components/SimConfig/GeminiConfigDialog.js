import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { AutoFixHigh as AutoFixHighIcon } from '@mui/icons-material';

const GeminiConfigDialog = ({ open, onClose, onApplyConfiguration }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateConfiguration = async () => {
    setIsLoading(true);
    try {
      // This is a mock of what the Gemini API response might look like
      // Replace this with actual Gemini API call
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a queueing network configuration based on this description: ${prompt}
              Format the response as JSON with the following structure:
              {
                "nodes": [
                  {
                    "id": "node-0",
                    "position": { "x": number, "y": number },
                    "data": {
                      "name": string,
                      "serviceDist": "deterministic" | "exponential",
                      "serviceRate": number,
                      "numberOfServers": number,
                      "arrivalDist": "deterministic" | "exponential",
                      "arrivalRate": number
                    }
                  }
                ],
                "edges": [
                  {
                    "id": "edge-0-1",
                    "source": "node-0",
                    "target": "node-1",
                    "data": { "weight": number }
                  }
                ]
              }`
            }]
          }]
        })
      });

      const data = await response.json();
      
      // Parse the response and extract the configuration
      const configuration = JSON.parse(data.candidates[0].content.parts[0].text);
      
      // Add required properties for React Flow
      const processedNodes = configuration.nodes.map(node => ({
        ...node,
        type: 'custom',
        data: {
          ...node.data,
          incomingConnections: 0,
          outgoingConnections: 0
        }
      }));

      const processedEdges = configuration.edges.map(edge => ({
        ...edge,
        type: 'smoothstep',
        animated: true,
        label: edge.data.weight.toFixed(2)
      }));

      onApplyConfiguration(processedNodes, processedEdges);
      onClose();
    } catch (error) {
      console.error('Error generating configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoFixHighIcon color="primary" />
          <Typography variant="h6">
            AI-Assisted Configuration
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe your queueing network, and I'll help you set it up.
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Example: Create a network with 3 nodes representing a customer service system. The first node is reception with 2 servers, which routes customers to either technical support (40%) or billing support (60%). Each support department has 3 servers."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerateConfiguration}
          disabled={!prompt.trim() || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeminiConfigDialog;