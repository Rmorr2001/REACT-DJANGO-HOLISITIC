export const formatNodesForAPI = (nodes, edges) => {
  console.log('Formatting nodes for API...');
  
  const nodeIndices = {};
  nodes.forEach((node, index) => {
    const id = node.id || `node-${index}`;
    nodeIndices[id] = index;
  });
  
  const apiNodes = nodes.map((node, index) => {
    const routingProbabilities = new Array(nodes.length).fill(0);
    
    edges
      .filter(edge => edge.source === node.id)
      .forEach(edge => {
        const targetIndex = nodeIndices[edge.target];
        if (targetIndex !== undefined) {
          routingProbabilities[targetIndex] = parseFloat(edge.data?.weight || 0);
        }
      });

    // Get position from various possible sources
    let posX = 100 + (index * 120);
    let posY = 100 + (index * 30);

    if (node.position) {
      posX = node.position.x;
      posY = node.position.y;
    } else if (node.positionAbsolute) {
      posX = node.positionAbsolute.x;
      posY = node.positionAbsolute.y;
    }

    return {
      node_name: node.data.name,
      service_distribution: node.data.serviceDist,
      service_rate: parseFloat(node.data.serviceRate),
      number_of_servers: parseInt(node.data.numberOfServers),
      arrival_distribution: node.data.arrivalDist,
      arrival_rate: parseFloat(node.data.arrivalRate),
      routing_probabilities: routingProbabilities,
      position_x: posX,
      position_y: posY,
      style: node.data.style || {}
    };
  });

  return apiNodes;
};
