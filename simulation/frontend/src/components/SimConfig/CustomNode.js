import React from 'react';
import { Handle, Position } from 'reactflow';

export const CustomNode = ({ id, data, isConnectable }) => {
  const hasIncoming = data.incomingConnections > 0 || data.arrivalRate > 0;
  const hasOutgoing = data.outgoingConnections > 0;
  const hasSelfConnection = data.connections?.some(conn => conn.target === id);
  const serverCount = Math.min(data.numberOfServers, 4);
  
  return (
    <div className="custom-node">
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