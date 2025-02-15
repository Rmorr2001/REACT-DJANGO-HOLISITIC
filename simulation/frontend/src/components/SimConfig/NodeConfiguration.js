import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import {
  Box,
  Container,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  AutoFixHigh as AIIcon,
} from '@mui/icons-material';

import 'reactflow/dist/style.css';
import '../../../static/css/NodeStyles.css';

import NodeConfigurationDialog from './useNodeConfiguration.js';
import GeminiChatDialog from './GeminiChatDialog.js';
import { nodeTypes } from './CustomNode.js';
import { defaultEdgeOptions, updateNodeConnections } from './NodeConfigurationUtils2.js';

const NodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showGeminiDialog, setShowGeminiDialog] = useState(false);

  const addNode = () => {
    const newNode = {
      id: `node-${nodes.length}`,
      type: 'custom',
      position: { x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: {
        name: `Node ${nodes.length + 1}`,
        serviceDist: 'deterministic',
        serviceRate: 1,
        numberOfServers: 1,
        arrivalDist: 'deterministic',
        arrivalRate: 0,
        incomingConnections: 0,
        outgoingConnections: 0
      }
    };
    setNodes(nodes => [...nodes, newNode]);
  };

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const existingEdges = edges.filter(e => e.source === params.source);
    const currentTotal = existingEdges.reduce((sum, edge) => sum + (edge.data?.weight || 0), 0);
    
    if (currentTotal <= 0.95) {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        data: { weight: Math.min(0.5, 1 - currentTotal) },
        label: `${Math.min(0.5, 1 - currentTotal).toFixed(2)}`,
      };
      
      setEdges(edges => [...edges, newEdge]);
      const updatedNodes = updateNodeConnections(nodes, [...edges, newEdge]);
      setNodes(updatedNodes);
    } else {
      alert("Total connection weights cannot exceed 1.0");
    }
  }, [nodes, edges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeDialog(true);
  }, []);

  const handleGeminiConfiguration = (newNodes, newEdges) => {
    if (newNodes) {
      // Ensure each node has a valid position and required properties
      const positionedNodes = newNodes.map((node, index) => {
        const radius = Math.min(newNodes.length * 50, 200);
        const angle = (2 * Math.PI * index) / newNodes.length;
        return {
          ...node,
          type: 'custom',
          position: {
            x: 400 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle)
          },
          data: {
            ...node.data,
            incomingConnections: 0,
            outgoingConnections: 0,
            connections: []
          }
        };
      });
      
      if (newEdges) {
        // Update node connections based on edges
        const nodesWithConnections = updateNodeConnections(positionedNodes, newEdges);
        setNodes(nodesWithConnections);
        setEdges(newEdges);
      } else {
        setNodes(positionedNodes);
      }
    } else if (newEdges) {
      // If only edges are updated, update node connections
      const updatedNodes = updateNodeConnections(nodes, newEdges);
      setNodes(updatedNodes);
      setEdges(newEdges);
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'white'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Configure Simulation Nodes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNode}
          >
            Add Node
          </Button>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={() => setShowGeminiDialog(true)}
          >
            AI Assistant
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => {}}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>

      <Box 
        sx={{ 
          flexGrow: 1,
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Background color="#f1f5f9" gap={16} />
          <Controls />
        </ReactFlow>
      </Box>

      <NodeConfigurationDialog
        open={showNodeDialog}
        onClose={() => setShowNodeDialog(false)}
        selectedNode={selectedNode}
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
      />

      <GeminiChatDialog
        open={showGeminiDialog}
        onClose={() => setShowGeminiDialog(false)}
        onApplyConfiguration={handleGeminiConfiguration}
      />
    </Box>
  );
};

export default NodeConfiguration;