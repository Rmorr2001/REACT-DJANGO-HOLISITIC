import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  TextField, 
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const NodeConfiguration = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [project, setProject] = useState(null);

  const distributionTypes = [
    { value: 'Deterministic', label: 'Deterministic' },
    { value: 'Exponential', label: 'Exponential' }
  ];

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/nodes/`);
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes || []);
        setProject(data.project);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const handleAddNode = () => {
    const newNode = {
      node_name: `Node ${nodes.length + 1}`,
      service_distribution: 'Deterministic',
      service_rate: 1,
      number_of_servers: 1,
      arrival_distribution: 'Deterministic',
      arrival_rate: 0,
      routing_probabilities: Array(nodes.length + 1).fill(0)
    };

    setNodes(prevNodes => [
      ...prevNodes.map(node => ({
        ...node,
        routing_probabilities: [...node.routing_probabilities, 0]
      })),
      newNode
    ]);
  };

  const handleNodeChange = (index, field, value) => {
    const updatedNodes = [...nodes];
    updatedNodes[index] = { ...updatedNodes[index], [field]: value };
    setNodes(updatedNodes);
  };

  const handleRoutingChange = (nodeIndex, targetIndex, value) => {
    const updatedNodes = [...nodes];
    const newValue = Math.min(Math.max(parseFloat(value || 0), 0), 1);
    
    // Update the probability
    updatedNodes[nodeIndex].routing_probabilities[targetIndex] = newValue;
    
    // Auto-adjust overflow
    const total = updatedNodes[nodeIndex].routing_probabilities.reduce((a, b) => a + b, 0);
    if (total > 1) {
      const overflow = total - 1;
      updatedNodes[nodeIndex].routing_probabilities[targetIndex] -= overflow;
    }
    
    setNodes(updatedNodes);
  };

  const handleDeleteNode = (index) => {
    setNodes(prevNodes => {
      const newNodes = prevNodes.filter((_, i) => i !== index);
      return newNodes.map(node => ({
        ...node,
        routing_probabilities: node.routing_probabilities.filter((_, i) => i !== index)
      }));
    });
  };

  const validateProbabilities = () => {
    return nodes.every(node => 
      node.routing_probabilities.reduce((a, b) => a + b, 0) <= 1.0 + Number.EPSILON
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/nodes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes }),
      });
  
      if (response.ok) {
        // Redirect directly to simulation dashboard
        navigate(`/projects/${projectId}/simulate`);
      }
    } catch (error) {
      console.error('Error saving nodes:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ py: 4, flex: 1, overflow: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Configure Simulation Nodes
        </Typography>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddNode}
          sx={{ mb: 4 }}
        >
          Add Node
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {nodes.map((node, index) => (
            <Paper key={index} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{node.node_name}</Typography>
                <IconButton onClick={() => handleDeleteNode(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Node Name"
                    value={node.node_name}
                    onChange={(e) => handleNodeChange(index, 'node_name', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Servers"
                    value={node.number_of_servers}
                    onChange={(e) => handleNodeChange(index, 'number_of_servers', parseInt(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Service Distribution"
                    value={node.service_distribution}
                    onChange={(e) => handleNodeChange(index, 'service_distribution', e.target.value)}
                  >
                    {distributionTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Service Rate"
                    value={node.service_rate}
                    onChange={(e) => handleNodeChange(index, 'service_rate', parseFloat(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Arrival Distribution"
                    value={node.arrival_distribution}
                    onChange={(e) => handleNodeChange(index, 'arrival_distribution', e.target.value)}
                  >
                    {distributionTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Arrival Rate"
                    value={node.arrival_rate}
                    onChange={(e) => handleNodeChange(index, 'arrival_rate', parseFloat(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Routing Probabilities (sum ≤ 1.0)
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 500 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Destination Node</TableCell>
                          {nodes.map((_, idx) => (
                            <TableCell key={idx} align="center">
                              Node {idx + 1}
                            </TableCell>
                          ))}
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>From {node.node_name}</TableCell>
                          {nodes.map((_, targetIndex) => (
                            <TableCell key={targetIndex} align="center">
                              <TextField
                                type="number"
                                inputProps={{
                                  step: 0.1,
                                  min: 0,
                                  max: 1,
                                  style: { width: 80, textAlign: 'center' }
                                }}
                                value={node.routing_probabilities[targetIndex]?.toFixed(2)}
                                onChange={(e) => handleRoutingChange(index, targetIndex, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell align="right">
                            {node.routing_probabilities.reduce((a, b) => a + b, 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, position: 'sticky', bottom: 20, bgcolor: 'background.paper', py: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/projects')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={nodes.length === 0}
          >
            Save Configuration
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NodeConfiguration;