import { addEdge, MarkerType } from 'reactflow';

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
    console.log('Fetched node data:', data); // Debug log
    
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('Invalid node data received from server');
    }

    const convertedNodes = data.nodes.map((node, index) => ({
      id: `node-${index}`,
      type: 'custom',
      position: { x: 200 + index * 200, y: 200 },
      data: {
        name: node.node_name,
        serviceDist: node.service_distribution.toLowerCase(),
        serviceRate: node.service_rate,
        numberOfServers: node.number_of_servers,
        arrivalDist: node.arrival_distribution.toLowerCase(),
        arrivalRate: node.arrival_rate,
        incomingConnections: 0,
        outgoingConnections: 0
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

export const handleSave = async (projectId, nodes, edges, navigate) => {
  try {
    console.log('Saving nodes:', nodes); // Debug log
    console.log('Saving edges:', edges); // Debug log

    const apiNodes = nodes.map(node => {
      // Create routing probabilities array initialized with zeros
      const routingProbabilities = new Array(nodes.length).fill(0);

      // Fill in the actual probabilities from edges
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          const targetIndex = parseInt(edge.target.split('-')[1]);
          routingProbabilities[targetIndex] = parseFloat(edge.data.weight) || 0;
        });

      return {
        node_name: node.data.name,
        service_distribution: node.data.serviceDist.charAt(0).toUpperCase() + node.data.serviceDist.slice(1),
        service_rate: parseFloat(node.data.serviceRate),
        number_of_servers: parseInt(node.data.numberOfServers),
        arrival_distribution: node.data.arrivalDist.charAt(0).toUpperCase() + node.data.arrivalDist.slice(1),
        arrival_rate: parseFloat(node.data.arrivalRate),
        routing_probabilities: routingProbabilities
      };
    });

    console.log('Formatted API nodes:', apiNodes); // Debug log

    const response = await fetch(`/api/projects/${projectId}/nodes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
      },
      body: JSON.stringify({ nodes: apiNodes })
    });

    const responseData = await response.json();
    console.log('Server response:', responseData); // Debug log

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to save nodes');
    }

    navigate(`/projects/${projectId}/simulate`);
    return true;
  } catch (error) {
    console.error('Error saving nodes:', error);
    alert(`Error saving configuration: ${error.message}`);
    return false;
  }
};

const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);