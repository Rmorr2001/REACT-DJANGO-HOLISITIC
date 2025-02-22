import { 
  createProjectViaAPI, 
  saveNodesViaAPI, 
  runSimulationViaAPI, 
  getSimulationResultsViaAPI,
  formatSimulationResults
} from './AISimulationUtils.js';

import { getAIAnalysisForSimulation } from './SimulationAssistantUtils.js';

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
 * Executes an AI action and returns information about the result
 * @param {Object} action - Parsed action object
 * @param {Object} userData - Current user and application data
 * @param {Function} navigate - React Router navigate function
 * @returns {Promise<Object>} - Result of the action
 */
export const executeAIAction = async (action, userData, navigate) => {
  if (!action || !action.type) return { success: false, message: 'Invalid action' };
  
  try {
    switch (action.type) {
      case 'navigate':
        if (navigate && action.path) {
          navigate(action.path);
          return { 
            success: true, 
            message: `Navigated to ${action.description || action.path}` 
          };
        }
        return { success: false, message: 'Invalid navigation path' };
        
      case 'create_project':
        if (action.name) {
          const projectId = await createProjectViaAPI(action.name, action.description || '');
          if (projectId) {
            // If there's a follow-up node configuration, store it
            const pendingConfig = action.configure_nodes ? {
              nodes: action.configure_nodes.nodes || [],
              edges: action.configure_nodes.edges || []
            } : null;
            
            return { 
              success: true, 
              message: `Created project "${action.name}" with ID ${projectId}`,
              projectId,
              pendingConfig  // Pass any pending configuration
            };
          }
        }
        return { success: false, message: 'Failed to create project' };
        
      case 'create_and_configure':
        // Handle creating a project and configuring nodes in one step
        if (action.project && action.project.name && action.nodes) {
          // First create the project
          const projectId = await createProjectViaAPI(
            action.project.name, 
            action.project.description || ''
          );
          
          if (!projectId) {
            return { success: false, message: 'Failed to create project' };
          }
          
          // Navigate to nodes page if needed
          if (navigate) {
            navigate(`/projects/${projectId}/nodes`);
          }
          
          // Wait a bit for the page to load and project to be set
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            // Process nodes to ensure proper data structure
            const processedNodes = action.nodes.map((node, index) => {
              // Ensure node has consistent structure for both API and UI
              return {
                id: node.id || `node-${index}`,
                name: node.name || node.data?.name || `Node ${index + 1}`,
                service_distribution: (node.service_distribution || node.data?.serviceDist || 'deterministic').toLowerCase(),
                service_rate: parseFloat(node.service_rate || node.data?.serviceRate || 1),
                number_of_servers: parseInt(node.number_of_servers || node.data?.numberOfServers || 1),
                arrival_distribution: (node.arrival_distribution || node.data?.arrivalDist || 'deterministic').toLowerCase(),
                arrival_rate: parseFloat(node.arrival_rate || node.data?.arrivalRate || (index === 0 ? 1 : 0)),
                // Also include data field for React Flow compatibility
                data: {
                  name: node.name || node.data?.name || `Node ${index + 1}`,
                  serviceDist: (node.service_distribution || node.data?.serviceDist || 'deterministic').toLowerCase(),
                  serviceRate: parseFloat(node.service_rate || node.data?.serviceRate || 1),
                  numberOfServers: parseInt(node.number_of_servers || node.data?.numberOfServers || 1),
                  arrivalDist: (node.arrival_distribution || node.data?.arrivalDist || 'deterministic').toLowerCase(),
                  arrivalRate: parseFloat(node.arrival_rate || node.data?.arrivalRate || (index === 0 ? 1 : 0)),
                }
              };
            });
            
            // Process edges for consistent structure
            const processedEdges = (action.edges || []).map(edge => {
              return {
                id: edge.id || `edge-${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target,
                weight: parseFloat(edge.weight || edge.data?.weight || 0.5),
                // Also include data field for React Flow compatibility
                data: { 
                  weight: parseFloat(edge.weight || edge.data?.weight || 0.5) 
                }
              };
            });
            
            // Try UI event with processed data
            window.dispatchEvent(new CustomEvent('ai-configure-nodes', { 
              detail: { 
                nodes: processedNodes, 
                edges: processedEdges 
              }
            }));
            
            // Configure the nodes via API
            await saveNodesViaAPI(projectId, processedNodes, processedEdges);
            
            return {
              success: true,
              message: `Created project "${action.project.name}" with ID ${projectId} and configured nodes`,
              projectId
            };
          } catch (error) {
            console.error("Failed to configure nodes:", error);
            return {
              success: true,
              message: `Created project "${action.project.name}" with ID ${projectId}, but failed to configure nodes: ${error.message}`,
              projectId
            };
          }
        }
        return { success: false, message: 'Invalid project or node configuration' };
        
      case 'configure_nodes':
        const projectId = action.project_id || userData.currentProject?.id;
        
        if (!projectId) {
          return { success: false, message: 'No project selected or specified' };
        }
        
        if (!action.nodes || !Array.isArray(action.nodes) || action.nodes.length === 0) {
          return { success: false, message: 'Invalid node configuration' };
        }
        
        // Navigate to nodes page if needed
        if (navigate && userData.currentProject?.id !== projectId) {
          navigate(`/projects/${projectId}/nodes`);
          // Wait a bit for the page to load
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Process nodes to ensure proper data structure
        const processedNodes = action.nodes.map((node, index) => {
          // Ensure node has consistent structure for both API and UI
          return {
            id: node.id || `node-${index}`,
            name: node.name || node.data?.name || `Node ${index + 1}`,
            service_distribution: (node.service_distribution || node.data?.serviceDist || 'deterministic').toLowerCase(),
            service_rate: parseFloat(node.service_rate || node.data?.serviceRate || 1),
            number_of_servers: parseInt(node.number_of_servers || node.data?.numberOfServers || 1),
            arrival_distribution: (node.arrival_distribution || node.data?.arrivalDist || 'deterministic').toLowerCase(),
            arrival_rate: parseFloat(node.arrival_rate || node.data?.arrivalRate || (index === 0 ? 1 : 0)),
            // Also include data field for React Flow compatibility
            data: {
              name: node.name || node.data?.name || `Node ${index + 1}`,
              serviceDist: (node.service_distribution || node.data?.serviceDist || 'deterministic').toLowerCase(),
              serviceRate: parseFloat(node.service_rate || node.data?.serviceRate || 1),
              numberOfServers: parseInt(node.number_of_servers || node.data?.numberOfServers || 1),
              arrivalDist: (node.arrival_distribution || node.data?.arrivalDist || 'deterministic').toLowerCase(),
              arrivalRate: parseFloat(node.arrival_rate || node.data?.arrivalRate || (index === 0 ? 1 : 0)),
            }
          };
        });
        
        // Process edges for consistent structure
        const processedEdges = (action.edges || []).map(edge => {
          return {
            id: edge.id || `edge-${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            weight: parseFloat(edge.weight || edge.data?.weight || 0.5),
            // Also include data field for React Flow compatibility
            data: { 
              weight: parseFloat(edge.weight || edge.data?.weight || 0.5) 
            }
          };
        });
        
        // First try UI event with processed data
        console.log("Attempting UI-based configuration with processed data");
        window.dispatchEvent(new CustomEvent('ai-configure-nodes', { 
          detail: { 
            nodes: processedNodes, 
            edges: processedEdges 
          }
        }));
        
        // Then try direct API
        try {
          console.log("Attempting direct API configuration");
          await saveNodesViaAPI(projectId, processedNodes, processedEdges);
        } catch (error) {
          console.error("Direct API configuration failed:", error);
          return { 
            success: false, 
            message: `Failed to configure nodes: ${error.message}`
          };
        }
        
        return { 
          success: true, 
          message: 'Applied node configuration'
        };
        
      case 'run_simulation':
        if (userData.currentProject?.id) {
          const results = await runSimulationViaAPI(userData.currentProject.id);
          
          // Navigate to results page if requested
          if (action.navigate_to_results && navigate) {
            navigate(`/projects/${userData.currentProject.id}/results`);
          }
          
          return { 
            success: true, 
            message: 'Simulation completed',
            results
          };
        }
        return { success: false, message: 'No project selected' };
        
      case 'get_simulation_results':
        if (userData.currentProject?.id) {
          const results = await getSimulationResultsViaAPI(userData.currentProject.id);
          if (results) {
            // Get enhanced analysis if requested
            let formattedResults = formatSimulationResults(results);
            
            if (action.with_analysis) {
              const analysis = getAIAnalysisForSimulation(results);
              formattedResults = analysis;
            }
            
            return { 
              success: true, 
              message: 'Retrieved simulation results',
              results,
              formattedResults
            };
          }
          return { success: false, message: 'No simulation results available' };
        }
        return { success: false, message: 'No project selected' };
        
      case 'analyze_simulation':
        if (userData.currentProject?.id) {
          const results = await getSimulationResultsViaAPI(userData.currentProject.id);
          if (results) {
            const analysis = getAIAnalysisForSimulation(results);
            
            // Navigate to results page if requested
            if (action.navigate_to_results && navigate) {
              navigate(`/projects/${userData.currentProject.id}/results`);
            }
            
            return { 
              success: true, 
              message: 'Analyzed simulation results',
              analysis,
              formattedResults: analysis
            };
          }
          return { success: false, message: 'No simulation results available to analyze' };
        }
        return { success: false, message: 'No project selected' };
        
      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    console.error('Error executing action:', error);
    return { 
      success: false, 
      message: `Error: ${error.message}`,
      error
    };
  }
};

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
    "name": "Grocery Store Simulation",
    "description": "Multi-node simulation of customer flow in a grocery store"
  },
  "nodes": [
    {
      "id": "node-0",
      "name": "Store Entrance",
      "data": {
        "serviceDist": "exponential",
        "serviceRate": 1.0,
        "numberOfServers": 1,
        "arrivalDist": "exponential",
        "arrivalRate": 2.0
      }
    },
    {
      "id": "node-1",
      "name": "Checkout",
      "data": {
        "serviceDist": "deterministic",
        "serviceRate": 1.5,
        "numberOfServers": 3,
        "arrivalDist": "deterministic",
        "arrivalRate": 0.0
      }
    }
  ],
  "edges": [
    {
      "source": "node-0",
      "target": "node-1",
      "data": { "weight": 1.0 }
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