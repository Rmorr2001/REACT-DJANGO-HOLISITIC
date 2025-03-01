import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useAIAssistant } from '../Gemini/AIAssistantContext.js';

import 'reactflow/dist/style.css';
import '../../../static/css/NodeStyles.css';

import NodeConfigurationDialog from './useNodeConfiguration.js';
import { nodeTypes, updateNodeConnections } from './CustomNode.js';
import { defaultEdgeOptions, onConnect, handleSave, fetchProjectData } from './NodeConfigurationUtils.js';
import { calculateNodePosition } from '../Gemini/SharedUtils.js';
import { calculateOptimalPosition } from '../SimConfig/CustomNode.js';

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
  const [isProcessingAIConfig, setIsProcessingAIConfig] = useState(false);
  
  const { openAssistant } = useAIAssistant();
  const initialized = useRef(false);
  const configApplied = useRef(false);
  const reactFlowInstance = useRef(null);

  const refreshFlow = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView();
    }
  }, []);

  const addNode = () => {
    const defaultIcons = ['Storage', 'Store', 'ShoppingCart', 'LocalShipping', 'Inventory'];
    const randomIcon = defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
    
    setNodes(prevNodes => {
      const index = prevNodes.length;
      const position = calculateNodePosition(index, nodes.length);
      
      const newNode = {
        id: `node-${index}`,
        type: 'custom',
        position: { ...position },
        data: {
          name: `Node ${index + 1}`,
          serviceDist: 'deterministic',
          serviceRate: 1,
          numberOfServers: 1,
          arrivalDist: 'deterministic',
          arrivalRate: index === 0 ? 1 : 0,
          incomingConnections: 0,
          outgoingConnections: 0,
          connections: [],
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 16,
            icon: randomIcon,
            iconColor: '#2563eb'
          }
        }
      };
      
      return [...prevNodes, newNode];
    });
    
    setTimeout(refreshFlow, 100);
  };

  // Modified handleAIConfiguration
  useEffect(() => {
    const handleAIConfiguration = (event) => {
      const { nodes: newNodes, edges: newEdges } = event.detail;
      
      if (newNodes && newNodes.length) {
        // Process and position nodes
        const processedNodes = newNodes.map((node, index) => {
          // Use provided position if it exists, otherwise calculate optimal position
          const position = node.position || node.data?.position || calculateNodePosition(index, newNodes.length);
          
          return {
            id: `node-${index}`,
            type: 'custom',
            position: {
              x: position.x,
              y: position.y
            },
            data: {
              name: node.data?.name || node.name || `Node ${index + 1}`,
              serviceDist: (node.data?.serviceDist || node.service_distribution || 'deterministic').toLowerCase(),
              serviceRate: parseFloat(node.data?.serviceRate || node.service_rate || 1),
              numberOfServers: parseInt(node.data?.numberOfServers || node.number_of_servers || 1),
              arrivalDist: (node.data?.arrivalDist || node.arrival_distribution || 'deterministic').toLowerCase(),
              arrivalRate: parseFloat(node.data?.arrivalRate || node.arrival_rate || 0),
              incomingConnections: 0,
              outgoingConnections: 0,
              connections: [],
              style: {
                backgroundColor: '#ffffff',
                borderColor: '#2563eb',
                borderWidth: 2,
                borderStyle: 'solid',
                borderRadius: 8,
                icon: node.data?.style?.icon || 'Store',
                iconColor: '#2563eb',
                ...(node.data?.style || {})
              }
            }
          };
        });

        // Clear existing nodes first
        setNodes([]);
        
        // Set new nodes after a short delay
        setTimeout(() => {
          setNodes(processedNodes);
          configApplied.current = true;
          
          // Process edges if they exist
          if (newEdges && newEdges.length) {
            const processedEdges = newEdges.map(edge => ({
              id: `edge-${edge.source}-${edge.target}`,
              source: edge.source,
              target: edge.target,
              type: 'smoothstep',
              animated: true,
              data: { weight: parseFloat(edge.data?.weight || edge.weight || 0.5) },
              label: (parseFloat(edge.data?.weight || edge.weight || 0.5)).toFixed(2)
            }));
            
            setEdges(processedEdges);
            
            // Update node connections
            const updatedNodes = updateNodeConnections(processedNodes, processedEdges);
            setNodes(updatedNodes);
          }
          
          refreshFlow();
        }, 100);
      }
    };
    
    window.addEventListener('ai-configure-nodes', handleAIConfiguration);
    return () => window.removeEventListener('ai-configure-nodes', handleAIConfiguration);
  }, [setNodes, setEdges, refreshFlow]);

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
      const success = await handleSave(projectId, nodes, edges, navigate, false);
      
      if (success) {
        setSavingStatus({ saving: false, success: true, error: null });
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

  const onSaveAndSimulate = async () => {
    if (!projectId || projectId === 'undefined') {
      setError('Invalid project ID');
      return;
    }

    try {
      setSavingStatus({ saving: true, success: false, error: null });
      const success = await handleSave(projectId, nodes, edges, navigate, true);
      
      if (!success) {
        setSavingStatus({ saving: false, success: false, error: 'Save failed' });
      }
    } catch (error) {
      setSavingStatus({ saving: false, success: false, error: error.message || 'Save failed' });
    }
  };

  // Handler for the manual refresh button
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchProjectData(projectId, setEdges, setNodes, updateNodeConnections);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message || 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!projectId || initialized.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const success = await fetchProjectData(projectId, setEdges, setNodes, updateNodeConnections);
      
      if (success) {
        initialized.current = true;
      }
    } catch (error) {
      console.error('Error loading project:', error);
      setError(error.message || 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          await fetchProjectData(projectId, setEdges, setNodes, updateNodeConnections);
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [projectId]);

  if (isLoading) {
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
        <CircularProgress />
        <Typography>Loading project configuration...</Typography>
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
      className="app-container" 
      sx={{ 
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
            startIcon={savingStatus.saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={onSaveConfiguration}
            disabled={nodes.length === 0 || savingStatus.saving}
          >
            {savingStatus.saving ? 'Saving...' : 'Save Configuration'}
          </Button>

          <Button
            variant="contained"
            startIcon={savingStatus.saving ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={onSaveAndSimulate}
            disabled={nodes.length === 0 || savingStatus.saving}
          >
            {savingStatus.saving ? 'Saving...' : 'Save & Run Simulation'}
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
          onInit={instance => {
            reactFlowInstance.current = instance;
            setTimeout(() => {
              instance.fitView({ padding: 0.2 });
            }, 100);
          }}
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