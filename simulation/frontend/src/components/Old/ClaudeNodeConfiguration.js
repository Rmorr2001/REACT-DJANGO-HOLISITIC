import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';

const GraphNodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastClickTime, setLastClickTime] = useState(0);

  // Canvas setup
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    setCtx(context);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw function for canvas
  const draw = () => {
    if (!ctx || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    connections.forEach(conn => {
      const startNode = nodes.find(n => n.id === conn.from);
      const endNode = nodes.find(n => n.id === conn.to);
      if (!startNode || !endNode) return;

      ctx.beginPath();
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;

      if (startNode.id === endNode.id) {
        const radius = startNode.radius * 1.5;
        ctx.arc(
          startNode.x,
          startNode.y - radius,
          radius/2,
          0,
          Math.PI * 2
        );
      } else {
        const midX = (startNode.x + endNode.x) / 2;
        const midY = (startNode.y + endNode.y) / 2 - 50;
        ctx.moveTo(startNode.x, startNode.y);
        ctx.quadraticCurveTo(midX, midY, endNode.x, endNode.y);
      }
      ctx.stroke();

      // Draw weight
      const weightX = startNode.id === endNode.id 
        ? startNode.x
        : (startNode.x + endNode.x) / 2;
      const weightY = startNode.id === endNode.id
        ? startNode.y - startNode.radius * 3
        : (startNode.y + endNode.y) / 2 - 25;

      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(conn.weight.toFixed(2), weightX, weightY);
    });

    // Draw nodes
    nodes.forEach(node => {
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.id === selectedNode?.id ? '#1976d2' : '#90caf9';
      ctx.fill();
      ctx.strokeStyle = '#1565c0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label and info
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.config.name, node.x, node.y);
      
      // Service info
      const yOffset = node.radius + 15;
      ctx.font = '12px Arial';
      ctx.fillText(
        `Servers: ${node.config.numberOfServers}`,
        node.x,
        node.y + yOffset
      );
      ctx.fillText(
        `λ=${node.config.arrivalRate} (${node.config.arrivalDist.slice(0, 3)})`,
        node.x,
        node.y + yOffset + 15
      );
      ctx.fillText(
        `μ=${node.config.serviceRate} (${node.config.serviceDist.slice(0, 3)})`,
        node.x,
        node.y + yOffset + 30
      );
    });
  };

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [nodes, connections, selectedNode, ctx]);

  // Mouse handlers
  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const findNodeAtPoint = (x, y) => {
    return nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const clickedNode = findNodeAtPoint(pos.x, pos.y);
    
    if (clickedNode) {
      const currentTime = Date.now();
      if (currentTime - lastClickTime < 300) {
        setSelectedNode(clickedNode);
        setShowNodeDialog(true);
      } else {
        setSelectedNode(clickedNode);
        setIsDragging(true);
        setDragOffset({
          x: pos.x - clickedNode.x,
          y: pos.y - clickedNode.y
        });
      }
      setLastClickTime(currentTime);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && selectedNode) {
      const pos = getMousePos(e);
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;
      
      setNodes(nodes.map(node =>
        node.id === selectedNode.id
          ? { ...node, x: newX, y: newY }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Node operations
  const addNode = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const newNode = {
      id: `node-${nodes.length}`,
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 25,
      config: {
        name: `Node ${nodes.length + 1}`,
        serviceDist: 'deterministic',
        serviceRate: 1,
        numberOfServers: 1,
        arrivalDist: 'deterministic',
        arrivalRate: 0
      }
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodeConfig = (nodeId, field, value) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? {
        ...node,
        config: { ...node.config, [field]: value }
      } : node
    ));
  };

  // Connection operations
  const addConnection = (targetNodeId) => {
    if (!selectedNode) return;
    
    const connectionExists = connections.some(
      conn => conn.from === selectedNode.id && conn.to === targetNodeId
    );
    
    if (!connectionExists) {
      const currentConnections = connections.filter(conn => conn.from === selectedNode.id);
      const currentTotal = currentConnections.reduce((sum, conn) => sum + conn.weight, 0);
      
      if (currentTotal <= 0.95) {
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: selectedNode.id,
          to: targetNodeId,
          weight: Math.min(0.5, 1 - currentTotal)
        };
        setConnections([...connections, newConnection]);
      } else {
        alert("Total connection weights cannot exceed 1.0");
      }
    }
  };

  const updateConnectionWeight = (connId, newWeight) => {
    const conn = connections.find(c => c.id === connId);
    if (!conn) return;

    const otherConnections = connections.filter(
      c => c.from === conn.from && c.id !== connId
    );
    const otherWeightsSum = otherConnections.reduce(
      (sum, c) => sum + c.weight,
      0
    );

    if (newWeight >= 0 && newWeight <= 1 && (otherWeightsSum + newWeight) <= 1) {
      setConnections(connections.map(c =>
        c.id === connId ? { ...c, weight: newWeight } : c
      ));
    } else {
      alert(`Invalid weight. Total weights for this node cannot exceed 1.0 (current other weights: ${otherWeightsSum.toFixed(2)})`);
    }
  };

  const removeConnection = (connId) => {
    setConnections(connections.filter(conn => conn.id !== connId));
  };

  // API operations
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/nodes/`);
      if (response.ok) {
        const data = await response.json();
        // Convert API data to graph format
        const convertedNodes = data.nodes.map((node, index) => ({
          id: `node-${index}`,
          x: 200 + index * 150,
          y: 200,
          radius: 25,
          config: {
            name: node.node_name,
            serviceDist: node.service_distribution.toLowerCase(),
            serviceRate: node.service_rate,
            numberOfServers: node.number_of_servers,
            arrivalDist: node.arrival_distribution.toLowerCase(),
            arrivalRate: node.arrival_rate
          }
        }));
        
        // Convert routing probabilities to connections
        const convertedConnections = [];
        data.nodes.forEach((node, fromIndex) => {
          node.routing_probabilities.forEach((probability, toIndex) => {
            if (probability > 0) {
              convertedConnections.push({
                id: `conn-${fromIndex}-${toIndex}`,
                from: `node-${fromIndex}`,
                to: `node-${toIndex}`,
                weight: probability
              });
            }
          });
        });

        setNodes(convertedNodes);
        setConnections(convertedConnections);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Convert graph data back to API format
      const apiNodes = nodes.map(node => {
        const routingProbabilities = new Array(nodes.length).fill(0);
        connections
          .filter(conn => conn.from === node.id)
          .forEach(conn => {
            const targetIndex = parseInt(conn.to.split('-')[1]);
            routingProbabilities[targetIndex] = conn.weight;
          });

        return {
          node_name: node.config.name,
          service_distribution: capitalizeFirst(node.config.serviceDist),
          service_rate: node.config.serviceRate,
          number_of_servers: node.config.numberOfServers,
          arrival_distribution: capitalizeFirst(node.config.arrivalDist),
          arrival_rate: node.config.arrivalRate,
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
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
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

        <Paper
          elevation={3}
          sx={{
            width: '100%',
            height: '600px',
            p: 2,
            position: 'relative'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </Paper>

        <Dialog 
          open={showNodeDialog} 
          onClose={() => setShowNodeDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Configure Node {selectedNode?.config.name}
          </DialogTitle>
          <DialogContent>
            {selectedNode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Node Name"
                  value={selectedNode.config.name}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'name', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Number of Servers"
                  type="number"
                  value={selectedNode.config.numberOfServers}
                  onChange={(e) => updateNodeConfig(
                    selectedNode.id,
                    'numberOfServers',
                    parseInt(e.target.value)
                  )}
                  inputProps={{ min: 1 }}
                  fullWidth
                />

                <FormControl>
                  <FormLabel>Arrival Distribution</FormLabel>
                  <RadioGroup
                    value={selectedNode.config.arrivalDist}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'arrivalDist', e.target.value)}
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
                    value={selectedNode.config.arrivalRate}
                    onChange={(e) => updateNodeConfig(
                      selectedNode.id,
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
                    value={selectedNode.config.serviceDist}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'serviceDist', e.target.value)}
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
                    value={selectedNode.config.serviceRate}
                    onChange={(e) => updateNodeConfig(
                      selectedNode.id,
                      'serviceRate',
                      parseFloat(e.target.value)
                    )}
                    inputProps={{ min: 0.1, step: 0.1 }}
                    sx={{ mt: 1 }}
                  />
                </FormControl>

                <Box>
                  <FormLabel>Connections</FormLabel>
                  <TextField
                    select
                    fullWidth
                    label="Add Connection"
                    onChange={(e) => addConnection(e.target.value)}
                    value=""
                    sx={{ mt: 1 }}
                  >
                    {nodes.map(node => (
                      <MenuItem key={node.id} value={node.id}>
                        {node.config.name}
                        {node.id === selectedNode.id ? " (self)" : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <Box sx={{ mt: 2 }}>
                    {connections
                      .filter(conn => conn.from === selectedNode.id)
                      .map(conn => {
                        const targetNode = nodes.find(n => n.id === conn.to);
                        return (
                          <Box key={conn.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              To {targetNode?.config.name}
                              {conn.from === conn.to ? " (self)" : ""}
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={conn.weight}
                              onChange={(e) => updateConnectionWeight(
                                conn.id,
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
                              onClick={() => removeConnection(conn.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        );
                      })}
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default GraphNodeConfiguration;