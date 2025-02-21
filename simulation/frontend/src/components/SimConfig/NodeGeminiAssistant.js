import React from 'react';
import GeminiChatShell from './GeminiChatShell.js';
import { Brightness7Rounded as AIIcon } from '@mui/icons-material';

// Helper functions from original GeminiChatDialog.js
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

/**
 * A specialized Gemini chat dialog for queue network configuration
 */
const NodeGeminiAssistant = ({ 
  open, 
  onClose, 
  onApplyConfiguration,
  messages,
  setMessages 
}) => {
  // Node-specific system prompt
  const systemPrompt = `You are a queue network simulation assistant. Your role is to help users understand and model queuing networks. 

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

Keep your responses conversational and educational. Explain concepts clearly and ask follow-up questions to better understand user needs.`;

  // Node-specific welcome message
  const welcomeMessage = {
    title: "Welcome! How can I help you with queue network modeling?",
    description: "I can help you understand queuing concepts, design networks, analyze performance, or explain how different configurations might affect your system. What would you like to explore?"
  };

  // Process Gemini's response for node-specific behavior
  const processResponse = (response) => {
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

  return (
    <GeminiChatShell
      open={open}
      onClose={onClose}
      messages={messages}
      setMessages={setMessages}
      systemPrompt={systemPrompt}
      dialogTitle="Queue Network Assistant"
      dialogIcon={<AIIcon color="primary" />}
      placeholderText="Ask me about queue networks, modeling concepts, or system design..."
      processResponse={processResponse}
      welcomeMessage={welcomeMessage}
    />
  );
};

export default NodeGeminiAssistant;