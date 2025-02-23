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
    const response = await fetch(`/api/projects/${projectId}/nodes/`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch nodes: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched node data:', data);
    
    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.warn('No nodes found or invalid data structure');
      setNodes([]);
      setEdges([]);
      return true;
    }

    // Ensure positions are properly initialized
    const convertedNodes = data.nodes.map((node, index) => {
      // Always calculate a default position
      const defaultPosition = {
        x: 100 + (index * 9),
        y: 100 + (index * 4)
      };

      // Ensure position is always a valid object
      const position = {
        x: typeof node.position_x === 'number' ? node.position_x : defaultPosition.x,
        y: typeof node.position_y === 'number' ? node.position_y : defaultPosition.y
      };

      return {
        id: `node-${index}`,
        type: 'custom',
        position: { ...position }, // Create a new object to ensure reference is clean
        data: {
          name: node.node_name || `Node ${index + 1}`,
          serviceDist: (node.service_distribution || 'Deterministic').toLowerCase(),
          serviceRate: parseFloat(node.service_rate) || 1,
          numberOfServers: parseInt(node.number_of_servers) || 1,
          arrivalDist: (node.arrival_distribution || 'Exponential').toLowerCase(),
          arrivalRate: parseFloat(node.arrival_rate) || (index === 0 ? 1 : 0),
          incomingConnections: 0,
          outgoingConnections: 0,
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 16,
            icon: 'Store',
            iconColor: '#2563eb',
            ...(node.style || {})
          }
        }
      };
    });

    // Process edges after nodes
    const convertedEdges = [];
    data.nodes.forEach((node, sourceIndex) => {
      if (Array.isArray(node.routing_probabilities)) {
        node.routing_probabilities.forEach((probability, targetIndex) => {
          if (probability > 0) {
            convertedEdges.push({
              id: `edge-node-${sourceIndex}-node-${targetIndex}`,
              source: `node-${sourceIndex}`,
              target: `node-${targetIndex}`,
              type: 'smoothstep',
              animated: true,
              data: { weight: probability },
              label: probability.toFixed(2)
            });
          }
        });
      }
    });

    // Important: Set nodes first, then edges
    const nodesWithConnections = updateNodeConnections(convertedNodes, convertedEdges);
    setNodes(nodesWithConnections);
    setEdges(convertedEdges);
    
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