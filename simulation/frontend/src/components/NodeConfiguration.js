import '../../static/css/NodeStyles.css';
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';


import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import 'reactflow/dist/style.css';

const CustomNode = ({ id, data, isConnectable }) => {
  const hasIncoming = data.incomingConnections > 0 || data.arrivalRate > 0;
  const hasOutgoing = data.outgoingConnections > 0;
  const hasSelfConnection = data.connections?.some(conn => conn.target === id);
  const serverCount = Math.min(data.numberOfServers, 4);
  
  return (
    <div className="custom-node">
      {/* Regular target handle for incoming connections from other nodes */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        isConnectable={isConnectable}
        style={{ visibility: hasIncoming ? 'visible' : 'hidden' }}
      />
      
      {/* Left side handles for self-connections */}
      <Handle
        type="source"
        position={Position.Left}
        id="source-self"
        isConnectable={isConnectable}
        style={{ 
          visibility: isConnectable ? 'visible' : 'hidden',
          left: -8
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-self"
        isConnectable={isConnectable}
        style={{ 
          visibility: isConnectable ? 'visible' : 'hidden',
          left: -8,
          top: '60%'
        }}
      />
      
      {hasIncoming && (
        <div className="flow-arrow incoming">
          <div className="flow-line" />
        </div>
      )}
      
      <div className="node-title">{data.name}</div>
      
      <div className="servers-container">
        {[...Array(serverCount)].map((_, i) => (
          <div 
            key={i} 
            className="server-dot"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
        {data.numberOfServers > 4 && (
          <span style={{ color: '#3b82f6', fontSize: '0.9rem' }}>
            +{data.numberOfServers - 4}
          </span>
        )}
      </div>
      
      <div className="metrics-container">
        <div className="metric-row">
          <span className="metric-label">Arrival (λ):</span>
          <div className="metric-value">
            <span className="metric-number">{data.arrivalRate}</span>
            <span className="metric-dist">({data.arrivalDist.slice(0, 3)})</span>
          </div>
        </div>
        
        <div className="metric-row">
          <span className="metric-label">Service (μ):</span>
          <div className="metric-value">
            <span className="metric-number">{data.serviceRate}</span>
            <span className="metric-dist">({data.serviceDist.slice(0, 3)})</span>
          </div>
        </div>
      </div>

      {hasOutgoing && (
        <div className="flow-arrow outgoing">
          <div className="flow-line" />
        </div>
      )}

      {/* Regular source handle for connections to other nodes */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        isConnectable={isConnectable}
        style={{ visibility: hasOutgoing ? 'visible' : 'hidden' }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const GraphNodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [formData, setFormData] = useState(null);
  const [edgeWeights, setEdgeWeights] = useState({});

  const updateNodeConnections = useCallback((nodes, edges) => {
    return nodes.map(node => {
      const incomingConnections = edges.filter(edge => edge.target === node.id).length;
      const outgoingConnections = edges.filter(edge => edge.source === node.id).length;
      const connections = edges
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
  }, []);

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#93c5fd',
    },
  };

  // Handle new connections
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const existingEdges = edges.filter(e => e.source === params.source);
    const currentTotal = existingEdges.reduce((sum, edge) => sum + (edge.data?.weight || 0), 0);
    const isSelfConnection = params.source === params.target;

    if (currentTotal <= 0.95) {
      // Modify connection points for self-connections
      if (isSelfConnection) {
        params.sourceHandle = 'source-self';
        params.targetHandle = 'target-self';
      } else {
        params.sourceHandle = 'source-bottom';
        params.targetHandle = 'target-top';
      }

      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        data: { weight: Math.min(0.5, 1 - currentTotal) },
        label: `${Math.min(0.5, 1 - currentTotal).toFixed(2)}`,
      };
      
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
      
      // Update nodes with new connection counts and connection info
      const updatedNodes = updateNodeConnections(nodes, newEdges);
      setNodes(updatedNodes);
    } else {
      alert("Total connection weights cannot exceed 1.0");
    }
  }, [nodes, edges, updateNodeConnections]);

  // Node selection handler
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setFormData({ ...node.data });
    
    // Initialize edge weights
    const nodeEdges = edges.filter(edge => edge.source === node.id);
    const weights = {};
    nodeEdges.forEach(edge => {
      weights[edge.id] = edge.data.weight;
    });
    setEdgeWeights(weights);
    
    setShowNodeDialog(true);
  }, [edges]);

  // Add new node
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

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle edge weight changes
  const handleEdgeWeightChange = (edgeId, newWeight) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const otherEdges = edges.filter(
      e => e.source === edge.source && e.id !== edgeId
    );
    const otherWeightsSum = otherEdges.reduce(
      (sum, e) => sum + (e.data?.weight || 0),
      0
    );

    if (newWeight >= 0 && newWeight <= 1 && (otherWeightsSum + newWeight) <= 1) {
      setEdgeWeights(prev => ({
        ...prev,
        [edgeId]: newWeight
      }));
    } else {
      alert(`Invalid weight. Total weights cannot exceed 1.0 (current other weights: ${otherWeightsSum.toFixed(2)})`);
    }
  };

  // Apply changes when dialog is closed
  const handleDialogClose = (save = false) => {
    if (save && selectedNode && formData) {
      // Update node data
      setNodes(nodes => nodes.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { ...formData }
          };
        }
        return node;
      }));

      // Update edge weights
      setEdges(edges => edges.map(edge => {
        if (edge.source === selectedNode.id && edgeWeights[edge.id] !== undefined) {
          return {
            ...edge,
            data: { ...edge.data, weight: edgeWeights[edge.id] },
            label: edgeWeights[edge.id].toFixed(2)
          };
        }
        return edge;
      }));
    }

    setShowNodeDialog(false);
    setSelectedNode(null);
    setFormData(null);
    setEdgeWeights({});
  };

  // Remove edge
  const removeEdge = (edgeId) => {
    const newEdges = edges.filter(edge => edge.id !== edgeId);
    setEdges(newEdges);
    
    // Update nodes with new connection counts
    const updatedNodes = updateNodeConnections(nodes, newEdges);
    setNodes(updatedNodes);
    
    const newEdgeWeights = { ...edgeWeights };
    delete newEdgeWeights[edgeId];
    setEdgeWeights(newEdgeWeights);
  };

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/nodes/`);
        if (response.ok) {
          const data = await response.json();
          
          // Convert nodes
          const convertedNodes = data.nodes.map((node, index) => ({
            id: `node-${index}`,
            type: 'custom',
            position: { x: 200 + index * 200, y: 200 },
            data: {
              name: node.node_name,
              serviceDist: node.service_distribution.toLowerCase(),
              serviceRate: node.service_rate,
              numberOfServers: node.number_of_servers,
              arrivalDist: node.arrival_distribution.toLowerCase(),
              arrivalRate: node.arrival_rate,
              incomingConnections: 0,
              outgoingConnections: 0
            }
          }));

          // Convert edges
          const convertedEdges = [];
          data.nodes.forEach((node, fromIndex) => {
            node.routing_probabilities.forEach((probability, toIndex) => {
              if (probability > 0) {
                convertedEdges.push({
                  id: `edge-${fromIndex}-${toIndex}`,
                  source: `node-${fromIndex}`,
                  target: `node-${toIndex}`,
                  type: 'smoothstep',
                  animated: true,
                  data: { weight: probability },
                  label: probability.toFixed(2)
                });
              }
            });
          });

          setEdges(convertedEdges);

          const nodesWithConnections = updateNodeConnections(convertedNodes, convertedEdges);
          setNodes(nodesWithConnections);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, [projectId, updateNodeConnections]);

  // Save configuration
  const handleSave = async () => {
    try {
      const apiNodes = nodes.map(node => {
        const routingProbabilities = new Array(nodes.length).fill(0);
        edges
          .filter(edge => edge.source === node.id)
          .forEach(edge => {
            const targetIndex = parseInt(edge.target.split('-')[1]);
            routingProbabilities[targetIndex] = edge.data.weight;
          });

        return {
          node_name: node.data.name,
          service_distribution: capitalizeFirst(node.data.serviceDist),
          service_rate: node.data.serviceRate,
          number_of_servers: node.data.numberOfServers,
          arrival_distribution: capitalizeFirst(node.data.arrivalDist),
          arrival_rate: node.data.arrivalRate,
          routing_probabilities: routingProbabilities
        };
      });

      const response = await fetch(`/api/projects/${projectId}/nodes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes: apiNodes }),
      });

      if (response.ok) {
        navigate(`/projects/${projectId}/simulate`);
      }
    } catch (error) {
      console.error('Error saving nodes:', error);
    }
  };

  const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    // Update the Container maxWidth to "xl" or false for full width
<Container maxWidth="xl">
  <Box
    sx={{
      px: 4,
      width: '150%',
      maxWidth: '1200px',  // Set a maxWidth to avoid the box being too wide
      margin: '0 auto',
    }}
  >
    <Typography variant="h4" gutterBottom>
      Configure Simulation Nodes
    </Typography>

    <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addNode}
      >
        Add Node
      </Button>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleSave}
      >
        Save Configuration
      </Button>
    </Box>

    <Box
  sx={{
    width: '100%',
    height: '85vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
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

        <Dialog 
          open={showNodeDialog} 
          onClose={() => handleDialogClose(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Configure Node {formData?.name}
          </DialogTitle>
          <DialogContent>
            {formData && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Node Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Number of Servers"
                  type="number"
                  value={formData.numberOfServers}
                  onChange={(e) => handleFormChange(
                    'numberOfServers',
                    parseInt(e.target.value)
                  )}
                  inputProps={{ min: 1 }}
                  fullWidth
                />

                <FormControl>
                  <FormLabel>Arrival Distribution</FormLabel>
                  <RadioGroup
                    value={formData.arrivalDist}
                    onChange={(e) => handleFormChange('arrivalDist', e.target.value)}
                    row
                  >
                    <FormControlLabel
                      value="deterministic"
                      control={<Radio />}
                      label="Deterministic"
                    />
                    <FormControlLabel
                      value="exponential"
                      control={<Radio />}
                      label="Exponential"
                    />
                  </RadioGroup>
                  <TextField
                    label="Arrival Rate"
                    type="number"
                    value={formData.arrivalRate}
                    onChange={(e) => handleFormChange(
                      'arrivalRate',
                      parseFloat(e.target.value)
                    )}
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={{ mt: 1 }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Service Distribution</FormLabel>
                  <RadioGroup
                    value={formData.serviceDist}
                    onChange={(e) => handleFormChange('serviceDist', e.target.value)}
                    row
                  >
                    <FormControlLabel
                      value="deterministic"
                      control={<Radio />}
                      label="Deterministic"
                    />
                    <FormControlLabel
                      value="exponential"
                      control={<Radio />}
                      label="Exponential"
                    />
                  </RadioGroup>
                  <TextField
                    label="Service Rate"
                    type="number"
                    value={formData.serviceRate}
                    onChange={(e) => handleFormChange(
                      'serviceRate',
                      parseFloat(e.target.value)
                    )}
                    inputProps={{ min: 0.1, step: 0.1 }}
                    sx={{ mt: 1 }}
                  />
                </FormControl>
                
               
                <Box>
                <FormLabel>Add Connection</FormLabel>
                <TextField
                    select
                    fullWidth
                    value=""
                    onChange={(e) => {
                    const targetNodeId = e.target.value;
                    if (!targetNodeId) return;

                    const existingEdge = edges.find(
                        edge => edge.source === selectedNode.id && edge.target === targetNodeId
                    );

                    if (!existingEdge) {
                        const existingEdges = edges.filter(edge => edge.source === selectedNode.id);
                        const currentTotal = existingEdges.reduce((sum, edge) => sum + (edge.data?.weight || 0), 0);

                        if (currentTotal <= 0.95) {
                        const newEdge = {
                            id: `edge-${selectedNode.id}-${targetNodeId}`,
                            source: selectedNode.id,
                            target: targetNodeId,
                            type: 'smoothstep',
                            animated: true,
                            data: { weight: Math.min(0.5, 1 - currentTotal) }
                        };
                        
                        const newWeight = Math.min(0.5, 1 - currentTotal);
                        setEdges(prev => [...prev, {
                            ...newEdge,
                            label: newWeight.toFixed(2)
                        }]);
                        
                        // Update edge weights state
                        setEdgeWeights(prev => ({
                            ...prev,
                            [newEdge.id]: newWeight
                        }));
                        } else {
                        alert("Total connection weights cannot exceed 1.0");
                        }
                    }
                    }}
                    sx={{ mt: 1, mb: 2 }}
                >
                    <MenuItem value="">Select a node to connect</MenuItem>
                    {nodes
                    .filter(node => node.id !== selectedNode?.id || true) // Include self-connections
                    .map(node => (
                        <MenuItem 
                        key={node.id} 
                        value={node.id}
                        disabled={edges.some(
                            edge => edge.source === selectedNode?.id && edge.target === node.id
                        )}
                        >
                        {node.data.name}
                        {node.id === selectedNode?.id ? " (self)" : ""}
                        </MenuItem>
                    ))}
                </TextField>
                </Box>

                <Box>
                  <FormLabel>Connections</FormLabel>
                  {edges
                    .filter(edge => edge.source === selectedNode?.id)
                    .map(edge => {
                      const targetNode = nodes.find(n => n.id === edge.target);
                      return (
                        <Box key={edge.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            To {targetNode?.data.name}
                            {edge.source === edge.target ? " (self)" : ""}
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={edgeWeights[edge.id] ?? edge.data.weight}
                            onChange={(e) => handleEdgeWeightChange(
                              edge.id,
                              parseFloat(e.target.value)
                            )}
                            inputProps={{
                              min: 0,
                              max: 1,
                              step: 0.1,
                              style: { width: 80 }
                            }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeEdge(edge.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                          </Box>
                      );
                    })}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
            <Button onClick={() => handleDialogClose(true)} variant="contained">
              Apply Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default GraphNodeConfiguration;