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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  AutoFixHigh as AIIcon,
} from '@mui/icons-material';
import { useAIAssistant } from '../Gemini/AppGeminiAssistant.js';

import 'reactflow/dist/style.css';
import '../../../static/css/NodeStyles.css';

import NodeConfigurationDialog from './useNodeConfiguration.js';
import { nodeTypes, updateNodeConnections } from './CustomNode.js';
import { defaultEdgeOptions, onConnect, handleSave, fetchProjectData } from './NodeConfigurationUtils.js';

const NodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState({
    saving: false,
    success: false,
    error: null
  });
  
  // Global AI assistant integration
  const { openAssistant } = useAIAssistant();

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

  // Listen for AI configuration events
  useEffect(() => {
    const handleAIConfiguration = (event) => {
      const { nodes: newNodes, edges: newEdges } = event.detail;
      
      if (newNodes && newNodes.length) {
        // Process and position nodes
        const processedNodes = newNodes.map((node, index) => ({
          id: node.id || `node-${index}`,
          type: 'custom',
          position: node.position || { 
            x: 200 + (index % 3) * 250, 
            y: 150 + Math.floor(index / 3) * 200 
          },
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
        
        setNodes(processedNodes);
      }
      
      if (newEdges && newEdges.length) {
        const processedEdges = newEdges.map(edge => ({
          id: edge.id || `edge-${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: true,
          data: { weight: parseFloat(edge.weight) || 0.5 },
          label: (parseFloat(edge.weight) || 0.5).toFixed(2)
        }));
        
        setEdges(processedEdges);
      }
      
      // Update node connections after we've set both nodes and edges
      if ((newNodes && newNodes.length) || (newEdges && newEdges.length)) {
        setTimeout(() => {
          const updatedNodes = updateNodeConnections(nodes, edges);
          setNodes(updatedNodes);
        }, 50);
      }
    };
    
    window.addEventListener('ai-configure-nodes', handleAIConfiguration);
    return () => {
      window.removeEventListener('ai-configure-nodes', handleAIConfiguration);
    };
  }, [nodes, edges, setNodes, setEdges]);

  const addNode = () => {
    const newNodeId = `node-${nodes.length}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: { 
        x: 100 + Math.random() * 200, 
        y: 100 + Math.random() * 200 
      },
      data: {
        name: `Node ${nodes.length + 1}`,
        serviceDist: 'deterministic',
        serviceRate: 1,
        numberOfServers: 1,
        arrivalDist: 'deterministic',
        arrivalRate: nodes.length === 0 ? 1 : 0, // Only first node gets default arrival rate
        incomingConnections: 0,
        outgoingConnections: 0,
        connections: []
      }
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeDialog(true);
  }, []);

  const onSaveConfiguration = async () => {
    if (!projectId || projectId === 'undefined') {
      setError('Invalid project ID');
      return;
    }

    try {
      setSavingStatus({ saving: true, success: false, error: null });
      const success = await handleSave(projectId, nodes, edges, navigate);
      
      if (success) {
        setSavingStatus({ saving: false, success: true, error: null });
        // Clear success status after 3 seconds
        setTimeout(() => {
          setSavingStatus(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        setSavingStatus({ saving: false, success: false, error: 'Save failed' });
      }
    } catch (error) {
      setSavingStatus({ saving: false, success: false, error: error.message || 'Save failed' });
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
        
        {savingStatus.success && (
          <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
            Configuration saved successfully!
          </Alert>
        )}
        
        {savingStatus.error && (
          <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
            {savingStatus.error}
          </Alert>
        )}
        
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
            onClick={openAssistant}
            color="secondary"
          >
            AI Assistant
          </Button>
          
          <Button
            variant="contained"
            startIcon={savingStatus.saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={onSaveConfiguration}
            disabled={nodes.length === 0 || savingStatus.saving}
          >
            {savingStatus.saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/projects')}
          >
            Back to Projects
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
      
      {nodes.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Start configuring your network
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add nodes to build your queuing network or use the AI Assistant for help
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={addNode}
            >
              Add First Node
            </Button>
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={openAssistant}
            >
              Ask AI Assistant
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NodeConfiguration;