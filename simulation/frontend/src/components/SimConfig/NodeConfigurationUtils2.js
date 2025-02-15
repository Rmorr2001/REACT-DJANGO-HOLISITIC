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
    const response = await fetch(`/api/projects/${projectId}/nodes/`);
    if (response.ok) {
      const data = await response.json();
      
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
        node.routing_probabilities.forEach((probability, toIndex) => {
          if (probability > 0) {
            convertedEdges.push({
              id: `edge-${fromIndex}-${toIndex}`,
              source: `node-${fromIndex}`,
              target: `node-${toIndex}`,
              type: 'smoothstep',
              animated: true,
              data: { weight: probability },
              label: probability.toFixed(2)
            });
          }
        });
      });

      setEdges(convertedEdges);
      const nodesWithConnections = updateNodeConnections(convertedNodes, convertedEdges);
      setNodes(nodesWithConnections);
    }
  } catch (error) {
    console.error('Error fetching project data:', error);
  }
};

export const handleSave = async (projectId, nodes, edges, navigate) => {
  try {
    const apiNodes = nodes.map(node => {
      const routingProbabilities = new Array(nodes.length).fill(0);
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          const targetIndex = parseInt(edge.target.split('-')[1]);
          routingProbabilities[targetIndex] = edge.data.weight;
        });

      return {
        node_name: node.data.name,
        service_distribution: capitalizeFirst(node.data.serviceDist),
        service_rate: node.data.serviceRate,
        number_of_servers: node.data.numberOfServers,
        arrival_distribution: capitalizeFirst(node.data.arrivalDist),
        arrival_rate: node.data.arrivalRate,
        routing_probabilities: routingProbabilities
      };
    });

    const response = await fetch(`/api/projects/${projectId}/nodes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nodes: apiNodes }),
    });

    if (response.ok) {
      navigate(`/projects/${projectId}/simulate`);
    }
  } catch (error) {
    console.error('Error saving nodes:', error);
  }
};

const capitalizeFirst = str => str.charAt(0).toUpperCase() + str.slice(1);