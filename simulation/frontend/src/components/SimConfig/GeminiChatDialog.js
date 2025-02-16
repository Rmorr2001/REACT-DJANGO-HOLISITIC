import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  AutoFixHigh as AIIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const API_KEY = 'AIzaSyCoJEcBZOQZFj-xuwKg9prq5w4LBBSM3NM';

const calculateNodePositions = (nodes) => {
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 300;
  const centerX = window.innerWidth / 2;
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: centerX + (HORIZONTAL_SPACING * (index - Math.floor(nodes.length / 2))),
      y: 100 + (Math.floor(index / 3) * VERTICAL_SPACING)
    }
  }));
};

const processConfiguration = (config) => {
  if (!config?.nodes || !Array.isArray(config.nodes)) {
    console.error('Invalid configuration: nodes array is required');
    return null;
  }

  try {
    const processedNodes = config.nodes.map((node, index) => ({
      id: node.id || `node-${index}`,
      type: 'custom',
      data: {
        name: node.name || `Node ${index + 1}`,
        serviceDist: (node.service_distribution || 'deterministic').toLowerCase(),
        serviceRate: parseFloat(node.service_rate) || 1,
        numberOfServers: parseInt(node.number_of_servers) || 1,
        arrivalDist: (node.arrival_distribution || 'deterministic').toLowerCase(),
        arrivalRate: parseFloat(node.arrival_rate) || 0,
        incomingConnections: 0,
        outgoingConnections: 0,
        connections: []
      }
    }));

    const processedEdges = (config.edges || []).map((edge, index) => ({
      id: `edge-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      data: { weight: parseFloat(edge.weight) || 0.5 },
      label: (parseFloat(edge.weight) || 0.5).toFixed(2)
    }));

    // Add positions to nodes
    const nodesWithPositions = calculateNodePositions(processedNodes);

    // Update connection counts
    const finalNodes = nodesWithPositions.map(node => {
      const incomingConnections = processedEdges.filter(edge => edge.target === node.id).length;
      const outgoingConnections = processedEdges.filter(edge => edge.source === node.id).length;
      const connections = processedEdges
        .filter(edge => edge.source === node.id)
        .map(edge => ({
          target: edge.target,
          weight: edge.data.weight
        }));

      return {
        ...node,
        data: {
          ...node.data,
          incomingConnections,
          outgoingConnections,
          connections
        }
      };
    });

    return {
      nodes: finalNodes,
      edges: processedEdges
    };
  } catch (error) {
    console.error('Error processing configuration:', error);
    return null;
  }
};

const GeminiChatDialog = ({ 
  open, 
  onClose, 
  onApplyConfiguration,
  messages,
  setMessages 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processAssistantResponse = (response) => {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const config = JSON.parse(jsonMatch[1]);
        const processedConfig = processConfiguration(config);
        if (processedConfig) {
          onApplyConfiguration(processedConfig.nodes, processedConfig.edges);
        }
        
        return response.replace(/```json\n[\s\S]*?\n```/g, '')
          .trim()
          .replace(/\n\n+/g, '\n\n');
      } catch (e) {
        console.error('Configuration processing error:', e);
        return response;
      }
    }
    return response;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a queue network simulation assistant. Your role is to help users understand and model queuing networks. 

When users request changes to the network, include a JSON configuration in your response using markdown code blocks with json syntax highlighting. The configuration must follow these rules:
1. Node IDs should be in format "node-0", "node-1", etc.
2. Service and arrival distributions must be "deterministic" or "exponential"
3. All rates must be numeric values
4. Configuration should be in a code block with nodes and edges arrays

Example configuration format:
\`\`\`json
{
  "nodes": [
    {
      "id": "node-0",
      "name": "Entry Point",
      "service_distribution": "exponential",
      "service_rate": 1.5,
      "number_of_servers": 2,
      "arrival_distribution": "exponential",
      "arrival_rate": 1.0
    }
  ],
  "edges": [
    {
      "source": "node-0",
      "target": "node-1",
      "weight": 0.7
    }
  ]
}
\`\`\`

Keep your responses conversational and educational. Explain concepts clearly and ask follow-up questions to better understand user needs.

Previous conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Current message:
${userMessage}`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates[0].content.parts[0].text;
      const processedMessage = processAssistantResponse(assistantMessage);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: processedMessage
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Could you please try rephrasing or provide more details?`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <AIIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Queue Network Assistant
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        p: 2
      }}>
        {messages.length === 0 ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            color: 'text.secondary'
          }}>
            <AIIcon sx={{ fontSize: 48 }} />
            <Typography variant="h6">
              Welcome! How can I help you with queue network modeling?
            </Typography>
            <Typography variant="body2" textAlign="center" maxWidth="80%">
              I can help you understand queuing concepts, design networks, 
              analyze performance, or explain how different configurations 
              might affect your system. What would you like to explore?
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    maxWidth: '80%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask me about queue networks, modeling concepts, or system design..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                color="primary"
              >
                {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            )
          }}
        />
      </Box>
    </Dialog>
  );
};

export default GeminiChatDialog;