import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Collapse
} from '@mui/material';
import ConfigurationForm from './NodeConfigurationForm.js';
import {
  ExpandLess,
  ExpandMore,
  Store,
  Person,
  ShoppingCart,
  LocalShipping,
  Inventory
} from '@mui/icons-material';

const NodeConfigurationDialog = ({ 
  open, 
  onClose, 
  selectedNode, 
  nodes, 
  edges, 
  setNodes, 
  setEdges 
}) => {
  const [formData, setFormData] = useState(null);
  const [edgeWeights, setEdgeWeights] = useState({});
  const [showStyleOptions, setShowStyleOptions] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.data.name,
        serviceDist: selectedNode.data.serviceDist,
        serviceRate: selectedNode.data.serviceRate,
        numberOfServers: selectedNode.data.numberOfServers,
        arrivalDist: selectedNode.data.arrivalDist,
        arrivalRate: selectedNode.data.arrivalRate,
        style: selectedNode.data.style || {}
      });
      
      const nodeEdges = edges.filter(edge => edge.source === selectedNode.id);
      const weights = {};
      nodeEdges.forEach(edge => {
        weights[edge.id] = edge.data?.weight || 0.5;
      });
      setEdgeWeights(weights);
    }
  }, [selectedNode, edges]);

  const handleDialogClose = (save) => {
    if (save && formData) {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                name: formData.name,
                serviceDist: formData.serviceDist,
                serviceRate: formData.serviceRate,
                numberOfServers: formData.numberOfServers,
                arrivalDist: formData.arrivalDist,
                arrivalRate: formData.arrivalRate,
                style: formData.style,
                incomingConnections: node.data.incomingConnections,
                outgoingConnections: node.data.outgoingConnections,
                connections: node.data.connections
              }
            };
          }
          return node;
        })
      );

      setEdges(prevEdges =>
        prevEdges.map(edge => {
          if (edgeWeights[edge.id] !== undefined) {
            return {
              ...edge,
              data: { weight: edgeWeights[edge.id] },
              label: edgeWeights[edge.id].toFixed(2)
            };
          }
          return edge;
        })
      );
    }
    onClose();
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      if (field.startsWith('style.')) {
        const styleField = field.split('.')[1];
        return {
          ...prev,
          style: {
            ...prev.style,
            [styleField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleEdgeWeightChange = (edgeId, newWeight) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const otherEdges = edges.filter(e => e.source === edge.source && e.id !== edgeId);
    const otherWeightsSum = otherEdges.reduce((sum, e) => sum + (e.data?.weight || 0), 0);

    if (newWeight >= 0 && newWeight <= 1 && (otherWeightsSum + newWeight) <= 1) {
      setEdgeWeights(prev => ({
        ...prev,
        [edgeId]: newWeight
      }));
    } else {
      alert(`Invalid weight. Total weights cannot exceed 1.0 (current other weights: ${otherWeightsSum.toFixed(2)})`);
    }
  };

  const removeEdge = (edgeId) => {
    const newEdges = edges.filter(edge => edge.id !== edgeId);
    setEdges(newEdges);
    const updatedNodes = updateNodeConnections(nodes, newEdges);
    setNodes(updatedNodes);
    const newEdgeWeights = { ...edgeWeights };
    delete newEdgeWeights[edgeId];
    setEdgeWeights(newEdgeWeights);
  };

  const handleAddConnection = (targetNodeId) => {
    if (!targetNodeId) return;
    
    const existingEdge = edges.find(
      edge => edge.source === selectedNode.id && edge.target === targetNodeId
    );

    if (!existingEdge) {
      const existingEdges = edges.filter(edge => edge.source === selectedNode.id);
      const currentTotal = existingEdges.reduce((sum, edge) => sum + (edge.data?.weight || 0), 0);

      if (currentTotal <= 0.95) {
        const newWeight = Math.min(0.5, 1 - currentTotal);
        const newEdge = {
          id: `edge-${selectedNode.id}-${targetNodeId}`,
          source: selectedNode.id,
          target: targetNodeId,
          type: 'smoothstep',
          animated: true,
          data: { weight: newWeight },
          label: newWeight.toFixed(2)
        };
        
        setEdges(prev => [...prev, newEdge]);
        setEdgeWeights(prev => ({
          ...prev,
          [newEdge.id]: newWeight
        }));
      } else {
        alert("Total connection weights cannot exceed 1.0");
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => handleDialogClose(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Configure Node {formData?.name}
      </DialogTitle>
      <DialogContent>
        {formData && (
          <ConfigurationForm
            formData={formData}
            handleFormChange={handleFormChange}
            selectedNode={selectedNode}
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            edgeWeights={edgeWeights}
            handleEdgeWeightChange={handleEdgeWeightChange}
            removeEdge={removeEdge}
            onAddConnection={handleAddConnection}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
        <Button onClick={() => handleDialogClose(true)} variant="contained">
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeConfigurationDialog;