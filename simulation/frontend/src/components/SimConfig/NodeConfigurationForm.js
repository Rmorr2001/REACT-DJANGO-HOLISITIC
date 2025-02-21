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
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  // Real-world applicable icons - importing individually to ensure they exist
  Restaurant as RestaurantIcon,
  LocalHospital as HospitalIcon,
  Factory as FactoryIcon, 
  Store as StoreIcon,
  // Verify these icons exist in the MUI icons package
  LocalShipping as ShippingIcon,
  Person as ServiceDeskIcon, // Changed from Meeting to Person which is more likely to exist
  Inventory as InventoryIcon,
  Storefront as CheckoutIcon,
  Group as WaitingAreaIcon // Changed from Groups to Group which is more likely to exist
} from '@mui/icons-material';

// Node type to icon mapping with real-world applications
const nodeTypeOptions = [
  { value: 'restaurant', label: 'Restaurant/Kitchen', icon: <RestaurantIcon /> },
  { value: 'hospital', label: 'Hospital/Clinic', icon: <HospitalIcon /> },
  { value: 'factory', label: 'Factory/Assembly', icon: <FactoryIcon /> },
  { value: 'store', label: 'Retail Store', icon: <StoreIcon /> },
  { value: 'shipping', label: 'Shipping/Logistics', icon: <ShippingIcon /> },
  { value: 'service', label: 'Service Desk', icon: <ServiceDeskIcon /> },
  { value: 'inventory', label: 'Inventory/Storage', icon: <InventoryIcon /> },
  { value: 'checkout', label: 'Checkout/Register', icon: <CheckoutIcon /> },
  { value: 'waiting', label: 'Waiting Area', icon: <WaitingAreaIcon /> },
];

const colorThemeOptions = [
  { value: 'default', label: 'Blue (Default)', color: '#3b82f6' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'green', label: 'Green', color: '#22c55e' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'cyan', label: 'Cyan', color: '#06b6d4' },
];

const ConfigurationForm = ({
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
      <Accordion>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon color="primary" />
            <Typography>Cosmetics</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Customize the visual appearance of this node. These settings don't affect the simulation results.
            </Typography>
            
            <FormControl fullWidth>
              <FormLabel>Node Icon</FormLabel>
              <Select
                value={formData.nodeType || 'service'}
                onChange={(e) => handleFormChange('nodeType', e.target.value)}
                renderValue={(value) => {
                  const option = nodeTypeOptions.find(opt => opt.value === value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option?.icon}
                      <span>{option?.label}</span>
                    </Box>
                  );
                }}
              >
                {nodeTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      <span>{option.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <FormLabel>Color Theme</FormLabel>
              <Select
                value={formData.colorTheme || 'default'}
                onChange={(e) => handleFormChange('colorTheme', e.target.value)}
                renderValue={(value) => {
                  const option = colorThemeOptions.find(opt => opt.value === value);
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          backgroundColor: option?.color 
                        }}
                      />
                      <span>{option?.label}</span>
                    </Box>
                  );
                }}
              >
                {colorThemeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          backgroundColor: option.color 
                        }}
                      />
                      <span>{option.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Core Node Configuration */}
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
          <FormControlLabel value="deterministic" control={<Radio />} label="Deterministic" />
          <FormControlLabel value="exponential" control={<Radio />} label="Exponential" />
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
          <FormControlLabel value="deterministic" control={<Radio />} label="Deterministic" />
          <FormControlLabel value="exponential" control={<Radio />} label="Exponential" />
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

      {/* Cosmetics Section in Accordion */}
      

      <Divider />

      {/* Connections Section */}
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
                disabled={edges.some(edge => edge.source === selectedNode?.id && edge.target === node.id)}
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
                  inputProps={{ min: 0, max: 1, step: 0.1, style: { width: 80 } }}
                />
                <IconButton size="small" color="error" onClick={() => removeEdge(edge.id)}>
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