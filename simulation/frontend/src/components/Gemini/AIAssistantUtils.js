import { getNodeStyle, calculateNodePosition } from './SharedUtils.js';
import { 
  createProjectViaAPI, 
  saveNodesViaAPI, 
  runSimulationViaAPI, 
  getSimulationResultsViaAPI,
  formatSimulationResults
} from './AISimulationUtils.js';

import { getAIAnalysisForSimulation } from './SimulationAssistantUtils.js';
import { calculateOptimalPosition } from '../SimConfig/CustomNode.js';

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
        if (action.project && action.project.name && action.nodes) {
          // Create project first
          const projectId = await createProjectViaAPI(
            action.project.name, 
            action.project.description || ''
          );

          if (!projectId) {
            throw new Error('No project ID received');
          }

          // Save nodes to API before navigation
          const processedNodes = action.nodes.map((node, index) => ({
            id: `node-${index}`,
            type: 'custom',
            position: node.position || calculateNodePosition(index, action.nodes.length),
            data: {
              name: node.data?.name || `Node ${index + 1}`,
              serviceDist: node.data?.serviceDist || 'Deterministic',
              serviceRate: parseFloat(node.data?.serviceRate || 1),
              numberOfServers: parseInt(node.data?.numberOfServers || 1),
              arrivalDist: node.data?.arrivalDist || 'Exponential',
              arrivalRate: parseFloat(node.data?.arrivalRate || (index === 0 ? 1 : 0)),
              style: node.data?.style || {}
            }
          }));

          // Save to Django API
          await saveNodesViaAPI(projectId, processedNodes, action.edges || []);

          // Then navigate
          if (navigate) {
            navigate(`/projects/${projectId}/nodes`);
          }

          return {
            success: true,
            message: `Created project "${action.project.name}" with ID ${projectId}`,
            projectId
          };
        }
        return { success: false, message: 'Invalid project configuration' };
        
      case 'create_and_configure':
        if (action.project && action.project.name && action.nodes) {
          // First create the project
          const projectId = await createProjectViaAPI(
            action.project.name, 
            action.project.description || ''
          );
          
          if (!projectId) {
            return { success: false, message: 'Failed to create project' };
          }
          
          // Process nodes with positions
          const processedNodes = action.nodes.map((node, index) => ({
            id: `node-${index}`,
            type: 'custom',
            position: node.position || calculateNodePosition(index, action.nodes.length),
            data: {
              name: node.data?.name || node.name || `Node ${index + 1}`,
              serviceDist: node.data?.serviceDist || 'Deterministic',
              serviceRate: parseFloat(node.data?.serviceRate || 1),
              numberOfServers: parseInt(node.data?.numberOfServers || 1),
              arrivalDist: node.data?.arrivalDist || 'Exponential',
              arrivalRate: parseFloat(node.data?.arrivalRate || (index === 0 ? 1 : 0)),
              style: node.data?.style || {}
            }
          }));

          // Save to Django API first
          await saveNodesViaAPI(projectId, processedNodes, action.edges || []);
          
          // Then navigate
          if (navigate) {
            navigate(`/projects/${projectId}/nodes`);
          }
          
          return {
            success: true,
            message: `Created project "${action.project.name}" with ID ${projectId} and configured nodes`,
            projectId
          };
        }
        return { success: false, message: 'Invalid project configuration' };
        
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
          try {
            // First check if we need to run the simulation
            let results = await getSimulationResultsViaAPI(userData.currentProject.id);
            
            if (!results) {
              // No results, try running the simulation first
              console.log('No results found, running simulation...');
              results = await runSimulationViaAPI(userData.currentProject.id);
            }

            if (!results) {
              return { 
                success: false, 
                message: 'Unable to get simulation results. Please ensure the simulation is configured correctly.' 
              };
            }

            // Now analyze the results
            const analysis = await getAIAnalysisForSimulation(results);
            
            if (!analysis) {
              return { 
                success: false, 
                message: 'Unable to analyze simulation results.' 
              };
            }

            if (action.navigate_to_results && navigate) {
              navigate(`/projects/${userData.currentProject.id}/results`);
            }
            
            return { 
              success: true, 
              message: analysis,
              analysis,
              formattedResults: analysis,
              shouldSendFollowUp: true
            };
          } catch (error) {
            console.error('Analysis error:', error);
            return { 
              success: false, 
              message: `Error analyzing simulation: ${error.message}` 
            };
          }
        }
        return { success: false, message: 'No project selected' };
        
      case 'configure_simulation':
        const { projectId: configProjectId, nodes, edges } = action.data;
        const success = await saveNodesViaAPI(configProjectId, nodes, edges);
        
        return {
          success: true,
          message: "Configuration has been saved.",
          config: {
            nodes,
            edges,
            projectId: configProjectId
          }
        };
        
      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    console.error('Error executing AI action:', error);
    return { success: false, message: error.message };
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

export const processResponse = async (response, userData, navigate) => {
  const action = processAIAction(response);
  console.log('Parsed action:', action);
  
  if (!action) return { 
    processedText: response.trim(), 
    pendingConfig: null,
    refreshProjects: false,
    refreshSimulation: false
  };
  
  const actionResult = await executeAIAction(action, userData, navigate);
  console.log('Action result:', actionResult);
  
  let cleanedResponse = response.replace(/```action\n[\s\S]*?\n```/g, '').trim();
  
  let shouldRefreshProjects = false;
  let shouldRefreshSimulation = false;
  let pendingConfig = null;
  let projectId = null;
  
  if (actionResult.success) {
    if (action.type === 'get_simulation_results' || action.type === 'analyze_simulation') {
      // For simulation analysis, just use the formatted results directly
      cleanedResponse = actionResult.formattedResults;
    } else {
      // For other actions, append the message more cleanly
      cleanedResponse += `\n${actionResult.message}`;
    }
    
    if (action.type === 'create_project' && actionResult.pendingConfig) {
      pendingConfig = actionResult.pendingConfig;
      projectId = actionResult.projectId;
      cleanedResponse += "\nI'll configure the nodes for this project once we're on the configuration page.";
    }
    
    if (action.type === 'create_project' || action.type === 'create_and_configure') {
      shouldRefreshProjects = true;
      projectId = actionResult.projectId;
    } else if (action.type === 'run_simulation') {
      shouldRefreshSimulation = true;
    }
  } else {
    cleanedResponse += `\nI'm sorry, I couldn't complete that action: ${actionResult.message}`;
  }
  
  return {
    processedText: cleanedResponse.trim(),
    pendingConfig,
    projectId,
    refreshProjects: shouldRefreshProjects,
    refreshSimulation: shouldRefreshSimulation
  };
};
