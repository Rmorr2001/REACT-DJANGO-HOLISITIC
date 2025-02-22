import { 
    processAIAction, 
    executeAIAction 
  } from './AIAssistantUtils.js';
  
  /**
   * Processes assistant responses - extracts and handles actions
   * @param {string} response - Raw response from AI assistant
   * @param {Object} userData - User data object
   * @param {Function} navigate - React Router navigate function
   * @returns {Promise<Object>} - Processing results including processed text
   */
  export const processResponse = async (response, userData, navigate) => {
    // Extract any AI action from the response
    const action = processAIAction(response);
    
    if (!action) return { 
      processedText: response, 
      pendingConfig: null,
      refreshProjects: false,
      refreshSimulation: false
    };
    
    // Execute the action
    const actionResult = await executeAIAction(action, userData, navigate);
    
    // Remove the action code block from response
    let cleanedResponse = response.replace(/```action\n[\s\S]*?\n```/g, '');
    
    // Tracking flags for refresh operations
    let shouldRefreshProjects = false;
    let shouldRefreshSimulation = false;
    let pendingConfig = null;
    let projectId = null;
    
    // Add confirmation message about the action
    if (actionResult.success) {
      // If we have formatted results, include them
      if (action.type === 'get_simulation_results' && actionResult.formattedResults) {
        cleanedResponse += `\n\n${actionResult.formattedResults}`;
      } else {
        cleanedResponse += `\n\n${actionResult.message}`;
      }
      
      // Handle pending node configurations
      if (action.type === 'create_project' && actionResult.pendingConfig) {
        pendingConfig = actionResult.pendingConfig;
        projectId = actionResult.projectId;
        
        cleanedResponse += "\n\nI'll configure the nodes for this project once we're on the configuration page.";
      }
      
      // Track which data needs refreshing
      if (action.type === 'create_project' || action.type === 'create_and_configure') {
        shouldRefreshProjects = true;
        projectId = actionResult.projectId;
      } else if (action.type === 'run_simulation') {
        shouldRefreshSimulation = true;
      }
    } else {
      // Add error message if action failed
      cleanedResponse += `\n\nI'm sorry, I couldn't complete that action: ${actionResult.message}`;
    }
    
    return {
      processedText: cleanedResponse,
      pendingConfig,
      projectId,
      refreshProjects: shouldRefreshProjects,
      refreshSimulation: shouldRefreshSimulation
    };
  };
  
  export default processResponse;