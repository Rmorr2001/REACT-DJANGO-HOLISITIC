import { addEdge, MarkerType } from 'reactflow';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';

export const defaultEdgeOptions = {
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

export const onConnect = (params, nodes, edges, setEdges, setNodes, updateNodeConnections) => {
  const sourceNode = nodes.find(n => n.id === params.source);
  const existingEdges = edges.filter(e => e.source === params.source);
  const currentTotal = existingEdges.reduce((sum, edge) => sum + (edge.data?.weight || 0), 0);
  const isSelfConnection = params.source === params.target;

  if (currentTotal <= 0.95) {
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
    
    const updatedNodes = updateNodeConnections(nodes, newEdges);
    setNodes(updatedNodes);
  } else {
    alert("Total connection weights cannot exceed 1.0");
  }
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

export const fetchProjectData = async (projectId, setEdges, setNodes, updateNodeConnections) => {
  try {
    const projectResponse = await fetch(`/api/projects/${projectId}/`);
    if (!projectResponse.ok) {
      throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
    }
    
    const nodesResponse = await fetch(`/api/projects/${projectId}/nodes/`);
    if (!nodesResponse.ok) {
      throw new Error(`Failed to fetch nodes: ${nodesResponse.statusText}`);
    }

    const data = await nodesResponse.json();
    console.log('Fetched node data:', data);
    
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('Invalid node data received from server');
    }

    const convertedNodes = data.nodes.map((node, index) => ({
      id: `node-${index}`,
      type: 'custom',
      position: { 
        x: node.position_x || 200 + index * 200, 
        y: node.position_y || 200 
      },
      data: {
        name: node.node_name,
        serviceDist: node.service_distribution.toLowerCase(),
        serviceRate: node.service_rate,
        numberOfServers: node.number_of_servers,
        arrivalDist: node.arrival_distribution.toLowerCase(),
        arrivalRate: node.arrival_rate,
        incomingConnections: 0,
        outgoingConnections: 0,
        style: node.style || {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 2,
          borderStyle: 'solid',
          borderRadius: 16,
          icon: 'Store',
          iconColor: '#2563eb'
        }
      }
    }));

    const convertedEdges = [];
    data.nodes.forEach((node, fromIndex) => {
      if (node.routing_probabilities) {
        node.routing_probabilities.forEach((probability, toIndex) => {
          if (probability > 0) {
            convertedEdges.push({
              id: `edge-node-${fromIndex}-node-${toIndex}`,
              source: `node-${fromIndex}`,
              target: `node-${toIndex}`,
              type: 'smoothstep',
              animated: true,
              data: { weight: probability },
              label: probability.toFixed(2)
            });
          }
        });
      }
    });

    setEdges(convertedEdges);
    const nodesWithConnections = updateNodeConnections(convertedNodes, convertedEdges);
    setNodes(nodesWithConnections);
    return true;
  } catch (error) {
    console.error('Error fetching project data:', error);
    throw error;
  }
};

export const handleSave = async (projectId, nodes, edges, navigate, shouldNavigate = false) => {
  try {
    console.group('Node Save Debug');
    console.log('Raw nodes:', nodes);
    console.log('Raw edges:', edges);

    const apiNodes = nodes.map(node => {
      console.group(`Processing node: ${node.id}`);
      console.log('Node position:', node.position);
      console.log('Node style:', node.data.style);

      const routingProbabilities = new Array(nodes.length).fill(0);

      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          const targetIndex = parseInt(edge.target.split('-')[1]);
          routingProbabilities[targetIndex] = parseFloat(edge.data.weight) || 0;
        });

      const nodeData = {
        node_name: node.data.name,
        service_distribution: node.data.serviceDist.charAt(0).toUpperCase() + node.data.serviceDist.slice(1),
        service_rate: parseFloat(node.data.serviceRate),
        number_of_servers: parseInt(node.data.numberOfServers),
        arrival_distribution: node.data.arrivalDist.charAt(0).toUpperCase() + node.data.arrivalDist.slice(1),
        arrival_rate: parseFloat(node.data.arrivalRate),
        routing_probabilities: routingProbabilities,
        position_x: node.position.x,
        position_y: node.position.y,
        style: node.data.style || {}
      };

      console.log('Processed node data:', nodeData);
      console.groupEnd();
      return nodeData;
    });

    console.log('Final API nodes:', apiNodes);
    console.groupEnd();

    const response = await fetch(`/api/projects/${projectId}/nodes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
      },
      body: JSON.stringify({ nodes: apiNodes })
    });

    const responseData = await response.json();
    console.log('Server response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to save nodes');
    }

    if (shouldNavigate) {
      navigate(`/projects/${projectId}/simulate`);
    }
    return true;
  } catch (error) {
    console.error('Error saving nodes:', error);
    alert(`Error saving configuration: ${error.message}`);
    return false;
  }
};

const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);