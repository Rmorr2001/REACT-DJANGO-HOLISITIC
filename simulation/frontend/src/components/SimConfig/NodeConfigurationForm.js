import React, { useState } from 'react';
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
  InputLabel,
  Select,
  Collapse,
  Button,
  Switch,
} from '@mui/material';
import { Delete as DeleteIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import * as MUIIcons from '@mui/icons-material';

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
  setNodes,
}) => {
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null); // 'background', 'border', 'icon', or null

  const handleStyleChange = (property, value) => {
    // Update form data
    handleFormChange(`style.${property}`, value);
    
    // Update node directly
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        style: {
          ...selectedNode.data.style,
          [property]: value
        }
      }
    };
    
    const updatedNodes = nodes.map(node => 
      node.id === selectedNode.id ? updatedNode : node
    );
    setNodes(updatedNodes);
  };

  const handleColorChange = (color, type) => {
    handleStyleChange(type, color.hex);
  };

  if (!formData) return null;
  
  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        label="Node Name"
        value={formData.name}
        onChange={(e) => handleFormChange('name', e.target.value)}
        fullWidth
        size="small"
        variant="outlined"
      />

      <TextField
        label="Number of Servers"
        type="number"
        value={formData.numberOfServers}
        onChange={(e) => handleFormChange('numberOfServers', parseInt(e.target.value))}
        inputProps={{ min: 1 }}
        fullWidth
        size="small"
        variant="outlined"
      />

      <FormControl>
        <FormLabel>Arrival Distribution</FormLabel>
        <RadioGroup
          value={formData.arrivalDist}
          onChange={(e) => handleFormChange('arrivalDist', e.target.value)}
          row
        >
          <FormControlLabel
            value="Deterministic"
            control={<Radio />}
            label="Deterministic"
          />
          <FormControlLabel
            value="Exponential"
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
          size="small"
          variant="outlined"
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
            value="Deterministic"
            control={<Radio />}
            label="Deterministic"
          />
          <FormControlLabel
            value="Exponential"
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
          size="small"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </FormControl>

      <Button
        onClick={() => setShowStyleOptions(!showStyleOptions)}
        endIcon={showStyleOptions ? <ExpandLess /> : <ExpandMore />}
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
      >
        Style Options
      </Button>

      <Collapse in={showStyleOptions}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Icon</InputLabel>
            <Select
              value={formData.style?.icon || ''}
              onChange={(e) => handleStyleChange('icon', e.target.value)}
              label="Icon"
            >
              <MenuItem value="">None</MenuItem>
              {[
                { value: 'Store', label: 'Store' },
                { value: 'ShoppingCart', label: 'Shopping Cart' },
                { value: 'LocalShipping', label: 'Shipping' },
                { value: 'Person', label: 'Person' },
                { value: 'Group', label: 'Group' },
                { value: 'Restaurant', label: 'Restaurant' },
                { value: 'LocalCafe', label: 'Cafe' },
                { value: 'LocalHospital', label: 'Hospital' },
                { value: 'School', label: 'School' },
                { value: 'AccountBalance', label: 'Bank' },
              ].map((item) => {
                const IconComponent = MUIIcons[item.value];
                return (
                  <MenuItem key={item.value} value={item.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconComponent sx={{ color: formData.style?.iconColor }} />
                      {item.label}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 1 }}>Color Scheme</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { label: 'Blue', bg: '#f0f7ff', border: '#bfdbfe', icon: '#2563eb' },
              { label: 'Green', bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a' },
              { label: 'Purple', bg: '#f5f3ff', border: '#ddd6fe', icon: '#7c3aed' },
              { label: 'Pink', bg: '#fdf2f8', border: '#fbcfe8', icon: '#db2777' },
              { label: 'Orange', bg: '#fff7ed', border: '#fed7aa', icon: '#ea580c' },
              { label: 'Gray', bg: '#f8fafc', border: '#e2e8f0', icon: '#475569' },
            ].map((preset) => (
              <Button
                key={preset.label}
                onClick={() => {
                  handleStyleChange('backgroundColor', preset.bg);
                  handleStyleChange('borderColor', preset.border);
                  handleStyleChange('iconColor', preset.icon);
                }}
                sx={{
                  minWidth: '80px',
                  height: '32px',
                  backgroundColor: preset.bg,
                  border: `1px solid ${preset.border}`,
                  color: preset.icon,
                  '&:hover': {
                    backgroundColor: preset.bg,
                    opacity: 0.9,
                  }
                }}
              >
                {preset.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Collapse>

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