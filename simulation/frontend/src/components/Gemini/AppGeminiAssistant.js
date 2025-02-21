import React, { useState, useContext, createContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GeminiChatShell from './GeminiChatShell.js';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { processAIAction, getSystemPrompt, getWelcomeMessage } from './AIAssistantUtils.js';

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
   * @returns {string} - Processed response with actions removed and confirmations added
   */
  const processResponse = (response) => {
    const action = processAIAction(response);
    
    // Handle different actions based on the action type
    if (action) {
      switch (action.type) {
        case 'navigate':
          navigate(action.path);
          return response.replace(/```action\n[\s\S]*?\n```/g, '')
            + `\n\nI've navigated you to the ${action.description || 'requested page'}.`;
          
        case 'create_project':
          createProject(action.name, action.description)
            .then(projectId => {
              if (projectId) {
                navigate(`/projects/${projectId}/nodes`);
              }
            });
          return response.replace(/```action\n[\s\S]*?\n```/g, '')
            + `\n\nI'm creating your project "${action.name}" now...`;
          
        case 'run_simulation':
          if (currentPage.includes('/nodes')) {
            // If we're on the configuration page, we need to save first
            return response.replace(/```action\n[\s\S]*?\n```/g, '')
              + `\n\nTo run the simulation, you'll need to save your configuration first. Should I save and run the simulation for you?`;
          }
          runSimulation(userData.currentProject?.id);
          return response.replace(/```action\n[\s\S]*?\n```/g, '')
            + `\n\nStarting the simulation with your parameters...`;
          
        case 'configure_nodes':
          if (action.nodes && userData.currentProject) {
            // This would integrate with your existing node configuration code
            window.dispatchEvent(new CustomEvent('ai-configure-nodes', { 
              detail: { nodes: action.nodes, edges: action.edges }
            }));
            return response.replace(/```action\n[\s\S]*?\n```/g, '')
              + `\n\nI've applied the node configuration to your project.`;
          }
          return response;
          
        default:
          return response;
      }
    }
    
    return response;
  };

  /**
   * Creates a new project via API
   * @param {string} name - Project name
   * @param {string} description - Project description
   * @returns {string|null} - Project ID if successful, null otherwise
   */
  const createProject = async (name, description) => {
    try {
      const response = await fetch('/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        },
        body: JSON.stringify({ name, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        fetchProjects(); // Refresh projects list
        return data.project_id || (data.project && data.project.id);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
    return null;
  };

  /**
   * Runs a simulation for the specified project
   * @param {string} projectId - ID of the project to run simulation for
   */
  const runSimulation = async (projectId) => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/simulate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        }
      });
      
      if (response.ok) {
        // Refresh simulation results
        fetchSimulationResults(projectId);
      }
    } catch (error) {
      console.error(`Error running simulation for project ${projectId}:`, error);
    }
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