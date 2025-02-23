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
    const action = processAIAction(response);
    
    if (!action) return { 
      processedText: response.trim(), 
      pendingConfig: null,
      refreshProjects: false,
      refreshSimulation: false
    };
    
    const actionResult = await executeAIAction(action, userData, navigate);
    let cleanedResponse = response.replace(/```action\n[\s\S]*?\n```/g, '').trim();
    
    if (actionResult.success) {
      if (action.type === 'configure_simulation') {
        // For configuration, don't navigate automatically
        return {
          processedText: cleanedResponse + `\n${actionResult.message}`,
          pendingConfig: actionResult.config,
          refreshProjects: false,
          refreshSimulation: false,
          shouldNavigate: false // New flag to control navigation
        };
      } else if (action.type === 'analyze_simulation') {
        // For analysis, return just the analysis without additional context
        return {
          processedText: actionResult.message,
          pendingConfig: null,
          refreshProjects: false,
          refreshSimulation: false
        };
      }
      
      // Handle other action types as before...
      cleanedResponse += `\n${actionResult.message}`;
    }
    
    return {
      processedText: cleanedResponse.trim(),
      pendingConfig: null,
      refreshProjects: false,
      refreshSimulation: false
    };
  };
  
  export default processResponse;