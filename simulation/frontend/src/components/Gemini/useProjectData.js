import { useState } from 'react';

/**
 * Custom hook for managing project data and API interactions
 * @returns {Object} Project data and operations
 */
export const useProjectData = () => {
  // Application data
  const [userData, setUserData] = useState({
    projects: [],
    currentProject: null,
    nodes: [],
    simulationResults: null
  });

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
        
        // Fetch nodes
        await fetchProjectNodes(projectId);
        
        // Check if on simulation page and fetch results if needed
        const currentPage = window.location.pathname;
        if (currentPage.includes('/simulate') || currentPage.includes('/results')) {
          await fetchSimulationResults(projectId);
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

  return {
    userData,
    fetchProjects,
    fetchProjectDetails,
    fetchProjectNodes,
    fetchSimulationResults
  };
};

export default useProjectData;