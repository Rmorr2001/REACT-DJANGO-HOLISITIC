/**
 * Utility functions for generating AI prompts and messages
 */

/**
 * Generates the system prompt for the AI based on current application state
 * @param {string} currentPage - Current page path
 * @param {Object} userData - User data including projects, nodes, and simulation results
 * @returns {string} - Tailored system prompt
 */
export const getSystemPrompt = (currentPage, userData) => {
    let basePrompt = `You are an AI assistant for a queuing network simulation web application. You can help users create projects, configure network nodes, run simulations, and analyze results.
  
  Current page: ${currentPage}
  ${userData.currentProject ? `Current project: ${userData.currentProject.name} (ID: ${userData.currentProject.id})` : 'No project selected'}
  
  When helping users, you can perform actions by including JSON in your response using markdown code blocks with the 'action' syntax. For example:
  
  \`\`\`action
  {
    "type": "navigate",
    "path": "/projects/",
    "description": "projects page"
  }
  \`\`\`
  
  Available actions:
  1. Navigate to a page: { "type": "navigate", "path": "/path" }
  2. Create a project: { "type": "create_project", "name": "Project Name", "description": "Description" }
  3. Configure nodes: { "type": "configure_nodes", "project_id": 123, "nodes": [...], "edges": [...] }
  4. Create project and configure nodes: { "type": "create_and_configure", "project": {"name": "Project Name"}, "nodes": [...], "edges": [...] }
  5. Run simulation: { "type": "run_simulation", "navigate_to_results": true }
  6. Get simulation results: { "type": "get_simulation_results", "with_analysis": false }
  7. Analyze simulation results: { "type": "analyze_simulation", "navigate_to_results": true }
  
  IMPORTANT: For node configuration, only "Deterministic" and "Exponential" distribution types are supported. Use the following format:
  
  \`\`\`action
  {
    "type": "configure_nodes",
    "project_id": 123,  // Optional: only needed if configuring a project other than current
    "nodes": [
      {
        "id": "node-0",
        "name": "Entry Point",
        "data": {
          "serviceDist": "exponential",
          "serviceRate": 1.5,
          "numberOfServers": 2,
          "arrivalDist": "exponential",
          "arrivalRate": 1.0
        }
      },
      {
        "id": "node-1",
        "name": "Processing Station",
        "data": {
          "serviceDist": "deterministic",
          "serviceRate": 2.0,
          "numberOfServers": 1,
          "arrivalDist": "deterministic",
          "arrivalRate": 0
        }
      }
    ],
    "edges": [
      {
        "source": "node-0",
        "target": "node-1",
        "data": { "weight": 0.7 }
      }
    ]
  }
  \`\`\`
  
  Or you can create a project and configure it all at once:
  
  \`\`\`action
  {
    "type": "create_and_configure",
    "project": {
      "name": "Retail Store Flow",
      "description": "Customer flow through a retail store"
    },
    "nodes": [
      {
        "id": "node-0",
        "name": "Store Entrance",
        "position": { "x": 100, "y": 250 },
        "data": {
          "serviceDist": "exponential",
          "serviceRate": 2.0,
          "numberOfServers": 1,
          "arrivalDist": "exponential",
          "arrivalRate": 1.5,
          "style": {
            "backgroundColor": "#f0f7ff",
            "borderColor": "#2563eb",
            "borderWidth": 2,
            "borderStyle": "solid",
            "borderRadius": 12,
            "icon": "Login",
            "iconColor": "#2563eb"
          }
        }
      }
    ]
  }
  \`\`\`
  
  To analyze simulation results, use:
  
  \`\`\`action
  {
    "type": "analyze_simulation",
    "navigate_to_results": true
  }
  \`\`\`
  
  Make sure each node has a unique ID in the format "node-0", "node-1", etc. The first node (node-0) should have an arrival rate > 0, while other nodes typically have arrival rate = 0. Each edge must have valid source and target node IDs, and a weight between 0 and 1.`;
  
    // Add page-specific context
    if (currentPage === '/projects') {
      basePrompt += `\n\nAvailable projects:\n${userData.projects.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}`;
    } else if (currentPage.includes('/nodes') && userData.nodes.length > 0) {
      basePrompt += `\n\nCurrent node configuration:\n${JSON.stringify(userData.nodes, null, 2)}`;
    } else if ((currentPage.includes('/simulate') || currentPage.includes('/results')) && userData.simulationResults) {
      basePrompt += `\n\nLatest simulation results available. You can analyze key metrics like utilization, waiting times, etc.`;
    }
    
    // Add styling and positioning information
    const styleAndPositioningPrompt = `
Node Styling and Positioning:
When configuring nodes, you can specify their position and visual style. Each node can include "position" and "style" properties:

\`\`\`action
{
  "type": "configure_nodes",
  "nodes": [{
    "id": "node-0",
    "name": "Store Entrance",
    "position": { "x": 100, "y": 100 },  // Position on canvas
    "data": {
      // ... regular node data ...
      "style": {
        "backgroundColor": "#f0f7ff",    // Light blue background
        "borderColor": "#2563eb",        // Blue border
        "borderWidth": 2,
        "borderStyle": "solid",          // solid, dashed, dotted, double
        "borderRadius": 12,              // Rounded corners
        "icon": "Store",                 // Material-UI icon name
        "iconColor": "#2563eb"           // Icon color
      }
    }
  }]
}
\`\`\`

Available Material-UI icons for nodes:
- Store, ShoppingCart, LocalShipping for retail/logistics
- Support, Person, Groups for service/customer nodes
- Settings, Build, Precision for manufacturing/processing
- Inventory, Storage for warehousing
- Login, Logout for entrance/exit points
- And many more standard Material-UI icons

Color suggestions:
- Blue tones (#f0f7ff, #2563eb) for entrance/input nodes
- Green tones (#f0fdf4, #16a34a) for processing/service nodes
- Purple tones (#f5f3ff, #7c3aed) for decision/routing nodes
- Orange tones (#fff7ed, #ea580c) for exit/output nodes
- Red tones (#fef2f2, #dc2626) for critical/high-priority nodes

When creating multiple nodes, consider spacing them in a logical flow:
- Entry points typically start at the left (x: 100-200)
- Processing nodes in the middle (x: 300-600)
- Exit points on the right (x: 700+)
- Use y-coordinates to create parallel paths (y: 100-500)
- Add slight position variations to avoid perfect grid alignment`;

    // Add the style prompt to the base prompt
    basePrompt += styleAndPositioningPrompt;
    
    return basePrompt;
  };
  
  /**
   * Generates a context-aware welcome message for the AI assistant
   * @param {string} currentPage - Current page path
   * @returns {Object} - Welcome message with title and description
   */
  export const getWelcomeMessage = (currentPage) => {
    if (currentPage.includes('/projects/') && currentPage.includes('/nodes')) {
      return {
        title: "Need help configuring your network?",
        description: "I can help you design queuing networks, explain concepts, or assist with specific configurations. What would you like to do?"
      };
    }
    
    if (currentPage.includes('/projects/') && (currentPage.includes('/simulate') || currentPage.includes('/results'))) {
      return {
        title: "Ready to analyze your simulation?",
        description: "I can help you interpret results, explain what different metrics mean, or suggest improvements to your network configuration."
      };
    }
    
    if (currentPage === '/new-project') {
      return {
        title: "Creating a new project?",
        description: "I can help you set up your project details. What kind of queuing network would you like to simulate?"
      };
    }
    
    return {
      title: "How can I help with your queuing network project?",
      description: "I can help you create a new project, configure network nodes, run simulations, or analyze results. What would you like to do?"
    };
  };

export const calculateNodePosition = (index, totalNodes) => {
  // Base spacing values
  const HORIZONTAL_SPACING = 400;
  const VERTICAL_SPACING = 300;
  const NODES_PER_ROW = Math.ceil(Math.sqrt(totalNodes)); // More dynamic row calculation
  
  // Calculate row and column using square-root based layout
  const row = Math.floor(index / NODES_PER_ROW);
  const col = index % NODES_PER_ROW;
  
  // Add more significant randomization
  const randomOffset = {
    x: (Math.random() - 0.5) * 100, // Increased from 50
    y: (Math.random() - 0.5) * 150  // Increased from 50
  };
  
  // Add slight vertical offset for every other column to create zigzag
  const zigzagOffset = col % 2 === 0 ? 0 : VERTICAL_SPACING / 3;
  
  return {
    x: 150 + (col * HORIZONTAL_SPACING) + randomOffset.x,
    y: 150 + (row * VERTICAL_SPACING) + randomOffset.y + zigzagOffset
  };
};