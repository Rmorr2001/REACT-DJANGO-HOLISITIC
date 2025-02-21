import React, { useState, useCallback, useEffect } from 'react';
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
  CircularProgress,
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
import { nodeTypes, updateNodeConnections } from './CustomNode.js';
import { defaultEdgeOptions, onConnect, handleSave, fetchProjectData } from './NodeConfigurationUtils.js';

const NodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showGeminiDialog, setShowGeminiDialog] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjectData = async () => {
      // Validate projectId
      if (!projectId || projectId === 'undefined') {
        setError('Invalid project ID');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading project with ID:', projectId); // Debug log
        await fetchProjectData(projectId, setEdges, setNodes, updateNodeConnections);
      } catch (error) {
        console.error('Error loading project:', error);
        setError(error.message || 'Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

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
        outgoingConnections: 0,
        nodeType: 'Restaurant', // Default node type
        colorTheme: 'default' // Default color theme
      }
    };
    setNodes(nodes => [...nodes, newNode]);
  };
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeDialog(true);
  }, []);

  const handleGeminiConfiguration = (newNodes, newEdges) => {
    if (newNodes) setNodes(newNodes);
    if (newEdges) setEdges(newEdges);
  };

  const onSaveConfiguration = async () => {
    if (!projectId || projectId === 'undefined') {
      setError('Invalid project ID');
      return;
    }

    const success = await handleSave(projectId, nodes, edges, navigate);
    if (success) {
      setChatHistory([]);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/projects')}
        >
          Return to Projects
        </Button>
      </Box>
    );
  }

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
        <Typography variant="h6">
          Configure Simulation Nodes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
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
          minHeight: 0,
          position: 'relative',
          '& .react-flow__container': {
            height: '100%'
          },
          '& .react-flow__viewport': {
            height: '100%'
          },
          '& .react-flow': {
            height: '100%'
          }
        }}
      >
        <ReactFlow
          // this is the code where the whole UI for the simulation happens.

          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={params => onConnect(params, nodes, edges, setEdges, setNodes, updateNodeConnections)}
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
        messages={chatHistory}
        setMessages={setChatHistory}
      />
    </Box>
  );
};

export default NodeConfiguration;