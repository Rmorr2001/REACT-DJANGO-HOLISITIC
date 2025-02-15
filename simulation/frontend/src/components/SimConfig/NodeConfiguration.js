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

// Import React Flow styles
import 'reactflow/dist/style.css';
import '../../../static/css/NodeStyles.css';

import NodeConfigurationDialog from './useNodeConfiguration.js';
import GeminiChatDialog from './GeminiChatDialog.js';
import { nodeTypes } from './CustomNode.js';
import { defaultEdgeOptions, handleSave } from './NodeConfigurationUtils2.js';

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
    // Your existing connect logic
  }, [nodes, edges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeDialog(true);
  }, []);

  const handleGeminiConfiguration = (newNodes, newEdges) => {
    if (newNodes) setNodes(newNodes);
    if (newEdges) setEdges(newEdges);
  };

  const onSaveConfiguration = () => {
    handleSave(projectId, nodes, edges, navigate);
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
            onClick={onSaveConfiguration}
            disabled={nodes.length === 0}
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