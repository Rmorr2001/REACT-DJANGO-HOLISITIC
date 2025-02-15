import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  IconButton,
  MenuItem,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

export const ConfigurationForm = ({
  formData,
  handleFormChange,
  selectedNode,
  nodes,
  edges,
  edgeWeights,
  handleEdgeWeightChange,
  removeEdge,
  onAddConnection,
}) => {
  if (!formData) return null;
  
  return (
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
        onChange={(e) => handleFormChange('numberOfServers', parseInt(e.target.value))}
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
          onChange={(e) => handleFormChange('arrivalRate', parseFloat(e.target.value))}
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
          onChange={(e) => handleFormChange('serviceRate', parseFloat(e.target.value))}
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
          onChange={(e) => onAddConnection(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        >
          <MenuItem value="">Select a node to connect</MenuItem>
          {nodes
            .filter(node => node.id !== selectedNode?.id || true)
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
                  onChange={(e) => handleEdgeWeightChange(edge.id, parseFloat(e.target.value))}
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
  );
};

export default ConfigurationForm;