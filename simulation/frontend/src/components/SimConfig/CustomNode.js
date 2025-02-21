import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  // Real-world applicable icons - imported individually to ensure they exist
  Restaurant as RestaurantIcon,
  LocalHospital as HospitalIcon,
  Factory as FactoryIcon, 
  Store as StoreIcon,
  // Updated to match the icons in NodeConfigurationForm.js
  LocalShipping as ShippingIcon,
  Person as ServiceDeskIcon, // Changed from Meeting to Person
  Inventory as InventoryIcon,
  Storefront as CheckoutIcon,
  Group as WaitingAreaIcon // Changed from Groups to Group
} from '@mui/icons-material';

// Node type to icon mapping with real-world applications
const nodeIcons = {
  'restaurant': RestaurantIcon,
  'hospital': HospitalIcon,
  'factory': FactoryIcon,
  'store': StoreIcon,
  'shipping': ShippingIcon,
  'service': ServiceDeskIcon,
  'inventory': InventoryIcon,
  'checkout': CheckoutIcon,
  'waiting': WaitingAreaIcon,
  // Add more icon mappings as needed
};

// Predefined color themes
const colorThemes = {
  'default': {
    background: 'linear-gradient(to bottom right, #f8faff, #e6f0ff)',
    border: '#bfdbfe',
    title: '#1e40af',
    serverDot: '#3b82f6',
    metricLabel: '#1e40af',
    metricNumber: '#1e3a8a',
    metricDist: '#3b82f6',
  },
  'red': {
    background: 'linear-gradient(to bottom right, #fff5f5, #ffe0e0)',
    border: '#fecaca',
    title: '#b91c1c',
    serverDot: '#ef4444',
    metricLabel: '#b91c1c',
    metricNumber: '#991b1b',
    metricDist: '#ef4444',
  },
  'green': {
    background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
    border: '#bbf7d0',
    title: '#15803d',
    serverDot: '#22c55e',
    metricLabel: '#15803d',
    metricNumber: '#166534',
    metricDist: '#22c55e',
  },
  'purple': {
    background: 'linear-gradient(to bottom right, #faf5ff, #f3e8ff)',
    border: '#e9d5ff',
    title: '#7e22ce',
    serverDot: '#a855f7',
    metricLabel: '#7e22ce',
    metricNumber: '#6b21a8',
    metricDist: '#a855f7',
  },
  'orange': {
    background: 'linear-gradient(to bottom right, #fff7ed, #ffedd5)',
    border: '#fed7aa',
    title: '#c2410c',
    serverDot: '#f97316',
    metricLabel: '#c2410c',
    metricNumber: '#9a3412',
    metricDist: '#f97316',
  },
  'cyan': {
    background: 'linear-gradient(to bottom right, #ecfeff, #cffafe)',
    border: '#a5f3fc',
    title: '#0e7490',
    serverDot: '#06b6d4',
    metricLabel: '#0e7490',
    metricNumber: '#155e75',
    metricDist: '#06b6d4',
  }
};

export const CustomNode = ({ id, data, isConnectable }) => {
  const hasIncoming = data.incomingConnections > 0 || data.arrivalRate > 0;
  const hasOutgoing = data.outgoingConnections > 0;
  const hasSelfConnection = data.connections?.some(conn => conn.target === id);
  const serverCount = Math.min(data.numberOfServers, 4);
  
  // Get node type and color theme (or use defaults)
  const nodeType = data.nodeType || 'service'; // Default to service if not specified
  const colorTheme = data.colorTheme || 'default'; // Default color theme
  const IconComponent = nodeIcons[nodeType] || nodeIcons.service;
  const colors = colorThemes[colorTheme] || colorThemes.default;
  
  // Create a dynamic style object based on the color theme
  const nodeStyle = {
    background: colors.background,
    borderColor: colors.border,
  };
  
  const titleStyle = {
    color: colors.title,
    borderBottomColor: colors.border,
  };
  
  return (
    <div className="custom-node" style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        isConnectable={isConnectable}
        style={{ visibility: hasIncoming ? 'visible' : 'hidden' }}
      />
      
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
      
      <div className="node-icon">
        <IconComponent style={{ color: colors.title, fontSize: '2rem' }} />
      </div>
      
      <div className="node-title" style={titleStyle}>{data.name}</div>
      
      <div className="servers-container">
        {[...Array(serverCount)].map((_, i) => (
          <div 
            key={i} 
            className="server-dot"
            style={{ 
              animationDelay: `${i * 200}ms`,
              backgroundColor: colors.serverDot 
            }}
          />
        ))}
        {data.numberOfServers > 4 && (
          <span style={{ color: colors.serverDot, fontSize: '0.9rem' }}>
            +{data.numberOfServers - 4}
          </span>
        )}
      </div>
      
      <div className="metrics-container">
        <div className="metric-row">
          <span className="metric-label" style={{ color: colors.metricLabel }}>Arrival (λ):</span>
          <div className="metric-value">
            <span className="metric-number" style={{ color: colors.metricNumber }}>{data.arrivalRate}</span>
            <span className="metric-dist" style={{ color: colors.metricDist }}>({data.arrivalDist.slice(0, 3)})</span>
          </div>
        </div>
        
        <div className="metric-row">
          <span className="metric-label" style={{ color: colors.metricLabel }}>Service (μ):</span>
          <div className="metric-value">
            <span className="metric-number" style={{ color: colors.metricNumber }}>{data.serviceRate}</span>
            <span className="metric-dist" style={{ color: colors.metricDist }}>({data.serviceDist.slice(0, 3)})</span>
          </div>
        </div>
      </div>

      {hasOutgoing && (
        <div className="flow-arrow outgoing">
          <div className="flow-line" />
        </div>
      )}

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

export const nodeTypes = {
  custom: CustomNode,
};

export const updateNodeConnections = (nodes, edges) => {
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
};

export const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);