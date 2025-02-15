import '../../../static/css/NodeStyles.css';
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
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import 'reactflow/dist/style.css';

import NodeConfigurationDialog from './useNodeConfiguration.js';
import { nodeTypes } from './CustomNode.js';
import { 
  defaultEdgeOptions,
  onConnect,
  updateNodeConnections,
  fetchProjectData,
  handleSave 
} from './NodeConfigurationUtils2.js';

const GraphNodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);

  useEffect(() => {
    fetchProjectData(projectId, setEdges, setNodes, updateNodeConnections);
  }, [projectId]);

  const onConnectCallback = useCallback((params) => {
    onConnect(params, nodes, edges, setEdges, setNodes, updateNodeConnections);
  }, [nodes, edges]);

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

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setShowNodeDialog(true);
  }, []);

  return (
    <Container maxWidth="xl">
      <Box sx={{ px: 4, width: '150%', maxWidth: '1200px', margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Configure Simulation Nodes
        </Typography>

        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addNode}>
            Add Node
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />} 
            onClick={() => handleSave(projectId, nodes, edges, navigate)}
          >
            Save Configuration
          </Button>
        </Box>

        <Box sx={{
          width: '100%',
          height: '85vh',
          border: '1px solid #ccc',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnectCallback}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={defaultEdgeOptions}
          >
            <Background color="#f1f5f9" gap={16} />
            <Controls 
              position="bottom-right"
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
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
      </Box>
    </Container>
  );
};

export default GraphNodeConfiguration;