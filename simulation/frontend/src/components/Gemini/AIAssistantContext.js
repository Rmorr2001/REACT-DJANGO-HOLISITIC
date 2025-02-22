// Complete AIAssistantContext.js replacement
import React, { createContext, useContext } from 'react';

// Create a context with a default value that matches the expected shape
const AIAssistantContext = createContext({
  openAssistant: () => console.warn('openAssistant not implemented'),
  closeAssistant: () => console.warn('closeAssistant not implemented'),
  isOpen: false,
  messages: [],
  setMessages: () => console.warn('setMessages not implemented'),
  userData: { projects: [], currentProject: null, nodes: [], simulationResults: null },
  processResponse: async () => ""
});

/**
 * Hook to access AI Assistant context
 * @returns {Object} - AI Assistant context
 */
export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    console.warn('useAIAssistant must be used within an AIAssistantProvider');
    // Return a default implementation to avoid null errors
    return {
      openAssistant: () => console.warn('openAssistant not available'),
      closeAssistant: () => console.warn('closeAssistant not available'),
      isOpen: false,
      messages: [],
      setMessages: () => console.warn('setMessages not available'),
      userData: { projects: [], currentProject: null, nodes: [], simulationResults: null },
      processResponse: async () => ""
    };
  }
  return context;
};

export default AIAssistantContext;