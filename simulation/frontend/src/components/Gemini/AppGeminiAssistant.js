import React, { useState, useContext, createContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GeminiChatShell from './GeminiChatShell.js';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { 
  processAIAction, 
  executeAIAction, 
  getSystemPrompt, 
  getWelcomeMessage 
} from './AIAssistantUtils.js';

// Create a context to manage AI assistant state across the application
const AIAssistantContext = createContext();

/**
 * AI Assistant Provider Component
 * Provides AI assistance functionality throughout the application
 */
export const AIAssistantProvider = ({ children }) => {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Application data
  const [userData, setUserData] = useState({
    projects: [],
    currentProject: null,
    nodes: [],
    simulationResults: null
  });
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('');
  
  // Store pending operations
  const [pendingProjectConfig, setPendingProjectConfig] = useState(null);

  // Track current page and update context
  useEffect(() => {
    const path = location.pathname;
    setCurrentPage(path);
    
    // Extract current project ID if on a project page
    const projectMatch = path.match(/\/projects\/([^/]+)/);
    if (projectMatch) {
      const projectId = projectMatch[1];
      fetchProjectDetails(projectId);
    }
  }, [location.pathname]);

  // Fetch projects list when needed
  useEffect(() => {
    if (currentPage.includes('/projects') && !userData.projects.length) {
      fetchProjects();
    }
  }, [currentPage]);
  
  // Apply pending configuration once we're on the nodes page and project is loaded
  useEffect(() => {
    const applyPendingConfig = async () => {
      if (pendingProjectConfig && 
          currentPage.includes('/nodes') && 
          userData.currentProject && 
          pendingProjectConfig.projectId === userData.currentProject.id) {
        
        console.log('Applying pending node configuration for project', pendingProjectConfig.projectId);
        
        // Try UI event
        window.dispatchEvent(new CustomEvent('ai-configure-nodes', { 
          detail: { 
            nodes: pendingProjectConfig.nodes, 
            edges: pendingProjectConfig.edges 
          }
        }));
        
        // Then API
        try {
          await executeAIAction({
            type: 'configure_nodes',
            project_id: pendingProjectConfig.projectId,
            nodes: pendingProjectConfig.nodes,
            edges: pendingProjectConfig.edges
          }, userData, navigate);
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'I have configured the nodes for your project.'
          }]);
        } catch (error) {
          console.error('Failed to apply pending configuration:', error);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I attempted to configure the nodes but encountered an error: ${error.message}`
          }]);
        }
        
        // Clear pending config
        setPendingProjectConfig(null);
      }
    };
    
    applyPendingConfig();
  }, [currentPage, userData.currentProject, pendingProjectConfig]);

  /**
   * Fetches all user projects from the API
   */
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/');
      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({
          ...prev,
          projects: data || []
        }));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  /**
   * Fetches details for a specific project
   * @param {string} projectId - ID of the project to fetch
   */
  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return;
    
    try {
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}/`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        
        // Update current project
        setUserData(prev => ({
          ...prev,
          currentProject: projectData
        }));
        
        // If on nodes page, fetch nodes
        if (currentPage.includes('/nodes')) {
          fetchProjectNodes(projectId);
        }
        
        // If on simulation page, fetch results
        if (currentPage.includes('/simulate') || currentPage.includes('/results')) {
          fetchSimulationResults(projectId);
        }
      }
    } catch (error) {
      console.error(`Error fetching project details for ID ${projectId}:`, error);
    }
  };

  /**
   * Fetches node configuration for a project
   * @param {string} projectId - ID of the project to fetch nodes for
   */
  const fetchProjectNodes = async (projectId) => {
    try {
      const nodesResponse = await fetch(`/api/projects/${projectId}/nodes/`);
      if (nodesResponse.ok) {
        const nodesData = await nodesResponse.json();
        setUserData(prev => ({
          ...prev,
          nodes: nodesData.nodes || []
        }));
      }
    } catch (error) {
      console.error(`Error fetching nodes for project ${projectId}:`, error);
    }
  };

  /**
   * Fetches simulation results for a project
   * @param {string} projectId - ID of the project to fetch results for
   */
  const fetchSimulationResults = async (projectId) => {
    try {
      const resultsResponse = await fetch(`/api/projects/${projectId}/results/`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setUserData(prev => ({
          ...prev,
          simulationResults: resultsData
        }));
      }
    } catch (error) {
      // Results might not exist yet, which is okay
      console.log(`No simulation results found for project ${projectId}`);
    }
  };

  /**
   * Processes assistant responses - extracts and handles actions
   * @param {string} response - Raw response from AI assistant
   * @returns {Promise<string>} - Processed response with actions removed and confirmations added
   */
  const processResponse = async (response) => {
    const action = processAIAction(response);
    
    if (!action) return response;
    
    const actionResult = await executeAIAction(action, userData, navigate);
    
    // Remove the action code block from response
    let cleanedResponse = response.replace(/```action\n[\s\S]*?\n```/g, '');
    
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
        setPendingProjectConfig({
          projectId: actionResult.projectId,
          nodes: actionResult.pendingConfig.nodes,
          edges: actionResult.pendingConfig.edges
        });
        
        // Navigate to the nodes page for the new project
        navigate(`/projects/${actionResult.projectId}/nodes`);
        
        cleanedResponse += "\n\nI'll configure the nodes for this project once we're on the configuration page.";
      }
      
      // Refresh data if needed
      if (action.type === 'create_project' || action.type === 'create_and_configure') {
        fetchProjects();
        if (actionResult.projectId) {
          await fetchProjectDetails(actionResult.projectId);
        }
      } else if (action.type === 'run_simulation' && userData.currentProject) {
        await fetchSimulationResults(userData.currentProject.id);
      }
    } else {
      // Add error message if action failed
      cleanedResponse += `\n\nI'm sorry, I couldn't complete that action: ${actionResult.message}`;
    }
    
    return cleanedResponse;
  };

  // Assistant UI control functions
  const openAssistant = () => setIsOpen(true);
  const closeAssistant = () => setIsOpen(false);

  return (
    <AIAssistantContext.Provider value={{ 
      openAssistant, 
      closeAssistant,
      isOpen,
      messages,
      setMessages,
      userData,
      // Expose the processResponse function to be used by other components
      processResponse
    }}>
      {children}
      
      <GeminiChatShell
        open={isOpen}
        onClose={closeAssistant}
        messages={messages}
        setMessages={setMessages}
        systemPrompt={getSystemPrompt(currentPage, userData)}
        dialogTitle="Queuing Network Assistant"
        dialogIcon={<AIIcon color="primary" />}
        placeholderText="Ask me about creating projects, configuring networks, or running simulations..."
        processResponse={processResponse}
        welcomeMessage={getWelcomeMessage(currentPage)}
      />
    </AIAssistantContext.Provider>
  );
};

/**
 * Hook to access AI Assistant context
 * @returns {Object} - AI Assistant context
 */
export const useAIAssistant = () => useContext(AIAssistantContext);