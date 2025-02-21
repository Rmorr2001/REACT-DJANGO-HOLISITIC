import React from 'react';

/**
 * Parses and processes AI action commands from response strings
 * @param {string} actionString - The full response string from the AI that may contain action blocks
 * @returns {Object|null} - Parsed action object or null if no valid action found
 */
export const processAIAction = (actionString) => {
  try {
    if (!actionString.includes('```action')) return null;
    const actionMatch = actionString.match(/```action\n([\s\S]*?)\n```/);
    if (!actionMatch) return null;
    
    // Clean up the JSON string by removing only single-line comments
    // This preserves all the actual data while making the JSON valid
    const cleanedJson = actionMatch[1]
      .split('\n')
      .map(line => {
        // Remove everything after '//' in each line
        const commentIndex = line.indexOf('//');
        return commentIndex !== -1 ? line.substring(0, commentIndex).trim() : line;
      })
      .join('\n');
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Error parsing AI action:', error);
    console.log('Raw action string:', actionString);
    return null;
  }
};

/**
 * Generates the system prompt for the AI based on current application state
 * @param {string} currentPage - Current page path
 * @param {Object} userData - User data including projects, nodes, and simulation results
 * @returns {string} - Tailored system prompt
 */
export const getSystemPrompt = (currentPage, userData) => {
  let basePrompt = `You are an AI assistant for a queuing network simulation web application. You can help users create projects, configure network nodes, and run simulations.

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
3. Configure nodes: { "type": "configure_nodes", "nodes": [...], "edges": [...] }
4. Run simulation: { "type": "run_simulation" }

For node configuration, use the same format as shown in the examples below:

Example node configuration:
\`\`\`action
{
  "type": "configure_nodes",
  "nodes": [
    {
      "id": "node-0",
      "name": "Entry Point",
      "service_distribution": "Exponential",
      "service_rate": 1.5,
      "number_of_servers": 2,
      "arrival_distribution": "Exponential",
      "arrival_rate": 1.0
    },
    {
      "id": "node-1",
      "name": "Processing Station",
      "service_distribution": "Deterministic",
      "service_rate": 2.0,
      "number_of_servers": 1,
      "arrival_distribution": "Deterministic",
      "arrival_rate": 0
    }
  ],
  "edges": [
    {
      "source": "node-0",
      "target": "node-1",
      "weight": 0.7
    }
  ]
}
\`\`\``;

  // Add page-specific context
  if (currentPage === '/projects') {
    basePrompt += `\n\nAvailable projects:\n${userData.projects.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}`;
  } else if (currentPage.includes('/nodes') && userData.nodes.length > 0) {
    basePrompt += `\n\nCurrent node configuration:\n${JSON.stringify(userData.nodes, null, 2)}`;
  } else if ((currentPage.includes('/simulate') || currentPage.includes('/results')) && userData.simulationResults) {
    basePrompt += `\n\nLatest simulation results available. You can describe key metrics like utilization, waiting times, etc.`;
  }
  
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
      title: "Ready to run your simulation?",
      description: "I can help you set up simulation parameters, explain what different options mean, or assist with interpreting results."
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
    description: "I can help you create a new project, configure network nodes, or run simulations. What would you like to do?"
  };
};