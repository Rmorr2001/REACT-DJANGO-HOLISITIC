// Complete AIAssistantProvider.js replacement
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GeminiChatShell from './GeminiChatShell.js';
import AIAssistantContext from './AIAssistantContext.js';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';
import { processResponse } from './AIResponseProcessor.js';
import { getSystemPrompt, getWelcomeMessage } from './AIPromptUtils.js';
import { useProjectData } from './useProjectData.js';

/**
 * AI Assistant Provider Component
 * Provides AI assistance functionality throughout the application
 */
const AIAssistantProvider = ({ children }) => {
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('');
  
  // Store pending operations
  const [pendingProjectConfig, setPendingProjectConfig] = useState(null);

  // Use custom hook for project data
  const projectData = useProjectData();
  // Create userData object with default empty values to avoid destructuring issues
  const userData = {
    projects: projectData?.userData?.projects || [],
    currentProject: projectData?.userData?.currentProject || null,
    nodes: projectData?.userData?.nodes || [],
    simulationResults: projectData?.userData?.simulationResults || null
  };

  // Safely extract methods from the hook
  const fetchProjects = projectData?.fetchProjects || (() => console.warn('fetchProjects not available'));
  const fetchProjectDetails = projectData?.fetchProjectDetails || (() => console.warn('fetchProjectDetails not available'));
  const fetchSimulationResults = projectData?.fetchSimulationResults || (() => console.warn('fetchSimulationResults not available'));

  useEffect(() => {
    const handleAnalysisRequest = (e) => {
      const projectId = e.detail.projectId;
      // Add a message suggesting the AI to analyze results
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Could you analyze the simulation results and provide insights?'
      }]);
    };
    
    window.addEventListener('ai-analyze-request', handleAnalysisRequest);
    return () => {
      window.removeEventListener('ai-analyze-request', handleAnalysisRequest);
    };
  }, []);
  
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
  }, [currentPage, userData.projects.length]);
  
  // Apply pending configuration once we're on the nodes page and project is loaded
  useEffect(() => {
    const applyPendingConfig = async () => {
      if (pendingProjectConfig && 
          currentPage.includes('/nodes') && 
          userData.currentProject && 
          pendingProjectConfig.projectId === userData.currentProject.id) {
        
        console.log('Applying pending node configuration for project', pendingProjectConfig.projectId);
        
        try {
          // Process the pending configuration using the imported processor
          const result = await processResponse({
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
   * Process assistant responses wrapper
   */
  const handleProcessResponse = async (response) => {
    try {
      const result = await processResponse(response, userData, navigate);
      
      // Handle side effects from processing
      if (result?.pendingConfig) {
        setPendingProjectConfig({
          projectId: result.projectId,
          nodes: result.pendingConfig.nodes,
          edges: result.pendingConfig.edges
        });
        
        // Navigate to the nodes page for the new project
        navigate(`/projects/${result.projectId}/nodes`);
      }
      
      // Refresh data if needed
      if (result?.refreshProjects) {
        fetchProjects();
        if (result.projectId) {
          await fetchProjectDetails(result.projectId);
        }
      } else if (result?.refreshSimulation && userData.currentProject) {
        await fetchSimulationResults(userData.currentProject.id);
      }
      
      return result?.processedText || response;
    } catch (error) {
      console.error("Error processing response:", error);
      return response;
    }
  };

  // Assistant UI control functions
  const openAssistant = () => setIsOpen(true);
  const closeAssistant = () => setIsOpen(false);

  // Create the context value object - ensure nothing is undefined
  const contextValue = {
    openAssistant, 
    closeAssistant,
    isOpen,
    messages,
    setMessages,
    userData,
    processResponse: handleProcessResponse
  };

  // Log the context value to debug
  console.log("AIAssistantProvider context value:", contextValue);

  return (
    <AIAssistantContext.Provider value={contextValue}>
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
        processResponse={handleProcessResponse}
        welcomeMessage={getWelcomeMessage(currentPage)}
      />
    </AIAssistantContext.Provider>
  );
};

export default AIAssistantProvider;