import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
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

const calculateNodePositions = (nodes, edges) => {
  // Create a graph representation for topological sorting
  const graph = new Map();
  const inDegree = new Map();
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  // Build the graph
  edges.forEach(edge => {
    graph.get(edge.source).push(edge.target);
    inDegree.set(edge.target, inDegree.get(edge.target) + 1);
  });

  // Find nodes with no incoming edges (roots)
  const roots = nodes
    .map(node => node.id)
    .filter(id => inDegree.get(id) === 0);

  // Calculate levels through BFS
  const levels = new Map();
  const queue = roots.map(id => ({ id, level: 0 }));
  
  while (queue.length > 0) {
    const { id, level } = queue.shift();
    levels.set(id, level);
    
    graph.get(id).forEach(nextId => {
      inDegree.set(nextId, inDegree.get(nextId) - 1);
      if (inDegree.get(nextId) === 0) {
        queue.push({ id: nextId, level: level + 1 });
      }
    });
  }

  // Calculate positions based on levels
  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 300;
  const nodesPerLevel = new Map();
  
  // Count nodes per level
  levels.forEach((level) => {
    nodesPerLevel.set(level, (nodesPerLevel.get(level) || 0) + 1);
  });

  // Position nodes
  return nodes.map(node => {
    const level = levels.get(node.id);
    const nodesInLevel = nodesPerLevel.get(level);
    const centerX = window.innerWidth / 2;
    
    return {
      ...node,
      position: {
        x: centerX - (HORIZONTAL_SPACING * (nodesInLevel - 1)) / 2 + 
           (HORIZONTAL_SPACING * (Array.from(levels.entries())
             .filter(([_, l]) => l === level)
             .findIndex(([id]) => id === node.id))),
        y: 100 + (level * VERTICAL_SPACING)
      }
    };
  });
};

const GeminiChatDialog = ({ open, onClose, onApplyConfiguration }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processConfiguration = (config) => {
    if (!config?.nodes) return null;

    try {
      // Process nodes
      const processedNodes = config.nodes.map((node, index) => ({
        id: node.id || `node-${index}`,
        type: 'custom',
        data: {
          name: `Node ${index + 1}`,
          serviceDist: (node.service_distribution || 'deterministic').toLowerCase(),
          serviceRate: parseFloat(node.service_rate) || 1,
          numberOfServers: 1,
          arrivalDist: (node.arrival_distribution || 'deterministic').toLowerCase(),
          arrivalRate: parseFloat(node.arrival_rate) || 0,
          incomingConnections: 0,
          outgoingConnections: 0,
          connections: []
        }
      }));

      // Process edges
      const processedEdges = (config.edges || []).map(edge => ({
        id: `edge-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: true,
        data: { weight: edge.weight || 0.5 },
        label: (edge.weight || 0.5).toFixed(2)
      }));

      // Calculate positions considering the graph structure
      const nodesWithPositions = calculateNodePositions(processedNodes, processedEdges);

      return {
        nodes: nodesWithPositions,
        edges: processedEdges
      };
    } catch (error) {
      console.error('Error processing configuration:', error);
      return null;
    }
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
              text: `You are a queue network simulation assistant. When users ask for nodes, you must respond with a valid JSON configuration that can be rendered.

For the configuration, follow these rules:
1. All node IDs should be in format "node-0", "node-1", etc.
2. Service and arrival distributions must be one of: "deterministic", "exponential"
3. All rates must be numeric values
4. Include the configuration in a JSON block with "nodes" and "edges" arrays

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

      try {
        // Extract JSON configuration if present
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const config = JSON.parse(jsonMatch[0]);
          const processedConfig = processConfiguration(config);
          if (processedConfig) {
            onApplyConfiguration(processedConfig.nodes, processedConfig.edges);
          }
        }
      } catch (e) {
        console.error('Configuration processing error:', e);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error processing your request: ${error.message}`
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

  const handleClose = () => {
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          AI Assistant
        </Typography>
        <IconButton size="small" onClick={handleClose}>
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
              How can I help you with your queue network?
            </Typography>
            <Typography variant="body2" textAlign="center" maxWidth="80%">
              You can ask me to create nodes, modify connections, adjust parameters,
              or explain how different configurations might affect your system.
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

      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider'
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Describe what you'd like to do with your queue network..."
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