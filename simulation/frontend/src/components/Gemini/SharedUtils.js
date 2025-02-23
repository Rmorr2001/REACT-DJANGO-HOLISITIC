export const getNodeStyle = (nodeName) => {
  const name = nodeName.toLowerCase();
  
  // Entry/arrival nodes
  if (name.includes('entry') || name.includes('arrival') || name.includes('entrance')) {
    return {
      backgroundColor: '#f0f7ff',
      borderColor: '#2563eb',
      borderWidth: 2,
      borderStyle: 'solid',
      borderRadius: 12,
      icon: 'Login',
      iconColor: '#2563eb'
    };
  }
  
  // Processing/assembly nodes
  if (name.includes('process') || name.includes('assembly') || name.includes('installation')) {
    return {
      backgroundColor: '#f0fdf4',
      borderColor: '#16a34a',
      borderWidth: 2,
      borderStyle: 'solid',
      borderRadius: 12,
      icon: 'Build',
      iconColor: '#16a34a'
    };
  }
  
  // Default style
  return {
    backgroundColor: '#f1f5f9',
    borderColor: '#64748b',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 12,
    icon: 'Settings',
    iconColor: '#64748b'
  };
};

export const calculateNodePosition = (index, totalNodes) => {
  // Base spacing values
  const HORIZONTAL_SPACING = 400;
  const VERTICAL_SPACING = 300;
  const NODES_PER_ROW = 3;
  
  // Calculate row and column
  const row = Math.floor(index / NODES_PER_ROW);
  const col = index % NODES_PER_ROW;
  
  // Add slight randomization to prevent perfect grid alignment
  const randomOffset = {
    x: (Math.random() - 0.5) * 50,
    y: (Math.random() - 0.5) * 50
  };
  
  return {
    x: 150 + (col * HORIZONTAL_SPACING) + randomOffset.x,
    y: 150 + (row * VERTICAL_SPACING) + randomOffset.y
  };
}; 