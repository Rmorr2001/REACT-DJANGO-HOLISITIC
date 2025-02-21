import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import ConfigurationForm from './NodeConfigurationForm.js';

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

  useEffect(() => {
    if (selectedNode) {
      setFormData({ ...selectedNode.data });
      
      const nodeEdges = edges.filter(edge => edge.source === selectedNode.id);
      const weights = {};
      nodeEdges.forEach(edge => {
        weights[edge.id] = edge.data.weight;
      });
      setEdgeWeights(weights);
    }
  }, [selectedNode, edges]);

  const handleDialogClose = (save = false) => {
    if (save && selectedNode && formData) {
      setNodes(nodes => nodes.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { ...formData }
          };
        }
        return node;
      }));

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

    onClose(); // resets the settings!
    setFormData(null);
    setEdgeWeights({});
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        {formData && ( // only show form if formData is availa
          <ConfigurationForm
            formData={formData}
            handleFormChange={handleFormChange}
            selectedNode={selectedNode}
            nodes={nodes}
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