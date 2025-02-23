/**
 * Utility functions for AI to interact with simulation APIs
 */

import { getNodeStyle, calculateNodePosition } from './SharedUtils.js';

/**
 * Creates a new project through the API
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @returns {Promise<string>} - Promise resolving to project ID if successful
 */
export const createProjectViaAPI = async (name, description) => {
    try {
      console.log(`Creating project: ${name}`);
      
      const response = await fetch('/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        },
        body: JSON.stringify({ name, description })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Project creation response:', data);
      
      return data.project?.id || data.project_id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };
  
  /**
   * Normalizes distribution type to match Django model choices
   * @param {string} distribution - Distribution type from UI or AI
   * @returns {string} - Normalized distribution that matches Django choices
   */
  export const normalizeDistribution = (distribution) => {
    // Only 'Deterministic' and 'Exponential' are valid in the Django model
    const validDistributions = ['deterministic', 'exponential'];
    
    if (!distribution) return 'Deterministic';
    
    const normalized = distribution.toLowerCase();
    if (validDistributions.includes(normalized)) {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    
    // Default to Exponential for anything else
    console.warn(`Invalid distribution type "${distribution}" replaced with "Exponential"`);
    return 'Exponential';
  };
  
  /**
   * Formats nodes data from React Flow format to Django API format
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @returns {Array} - Nodes in Django API format
   */
  export const formatNodesForAPI = (nodes, edges) => {
    console.log('Formatting nodes for API...');
    
    // Create a mapping of node IDs to indices
    const nodeIndices = {};
    nodes.forEach((node, index) => {
      const id = node.id || `node-${index}`;
      nodeIndices[id] = index;
    });
    
    // Create routing probabilities arrays initialized with zeros
    const apiNodes = nodes.map((node, index) => {
      const position = calculateNodePosition(index, nodes.length);
      
      // Initialize routing probabilities array
      const routingProbabilities = new Array(nodes.length).fill(0);
      
      // Fill in probabilities from edges
      edges
        .filter(edge => edge.source === node.id)
        .forEach(edge => {
          const targetIndex = nodeIndices[edge.target];
          if (targetIndex !== undefined) {
            routingProbabilities[targetIndex] = parseFloat(edge.data?.weight || 0);
          }
        });

      return {
        node_name: node.data.name,
        service_distribution: normalizeDistribution(node.data.serviceDist),
        service_rate: parseFloat(node.data.serviceRate),
        number_of_servers: parseInt(node.data.numberOfServers),
        arrival_distribution: normalizeDistribution(node.data.arrivalDist),
        arrival_rate: parseFloat(node.data.arrivalRate),
        routing_probabilities: routingProbabilities,
        position_x: position.x,
        position_y: position.y,
        style: node.data.style || {}
      };
    });

    return apiNodes;
  };
  
  /**
   * Saves node configuration to a project using the handleSave approach from NodeConfigurationUtils.js
   * @param {string} projectId - Project ID
   * @param {Array} nodes - Nodes in React Flow format
   * @param {Array} edges - Edges in React Flow format
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  export const saveNodesViaAPI = async (projectId, nodes, edges) => {
    try {
      console.log(`Saving nodes for project ${projectId}`);
      
      // Format the nodes for the Django API
      const apiNodes = formatNodesForAPI(nodes, edges);
  
      console.log('Sending API nodes:', apiNodes);
  
      const response = await fetch(`/api/projects/${projectId}/nodes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        },
        body: JSON.stringify({ nodes: apiNodes })
      });
  
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          errorMessage = errorData.error || errorData.details || response.statusText;
        } catch (e) {
          const errorText = await response.text();
          console.error('API error text:', errorText);
        }
        throw new Error(`Failed to save nodes: ${errorMessage}`);
      }
  
      const responseData = await response.json();
      console.log('Save nodes response:', responseData);
  
      return true;
    } catch (error) {
      console.error('Error saving nodes:', error);
      throw error;
    }
  };
  
  /**
   * Runs a simulation for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Promise resolving to simulation results
   */
  export const runSimulationViaAPI = async (projectId) => {
    try {
      console.log(`Running simulation for project ${projectId}`);
      
      const response = await fetch(`/api/projects/${projectId}/simulate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
        }
      });
  
      console.log('Simulation API response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          console.error('Simulation API error response:', errorData);
          errorMessage = errorData.error || response.statusText;
        } catch (e) {
          const errorText = await response.text();
          console.error('Simulation API error text:', errorText);
        }
        throw new Error(`Failed to run simulation: ${errorMessage}`);
      }
  
      const data = await response.json();
      console.log('Simulation results:', data);
      return data.results;
    } catch (error) {
      console.error('Error running simulation:', error);
      throw error;
    }
  };
  
  /**
   * Fetches simulation results for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Promise resolving to simulation results
   */
  export const getSimulationResultsViaAPI = async (projectId) => {
    try {
      console.log(`Fetching simulation results for project ${projectId}`);
      
      const response = await fetch(`/api/projects/${projectId}/results/`);
      
      console.log('Results API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No simulation results found');
          return null; // No results yet
        }
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          console.error('Results API error response:', errorData);
          errorMessage = errorData.error || response.statusText;
        } catch (e) {
          const errorText = await response.text();
          console.error('Results API error text:', errorText);
        }
        throw new Error(`Failed to fetch results: ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log('Fetched simulation results:', data);
      return data;
    } catch (error) {
      console.error('Error fetching simulation results:', error);
      throw error;
    }
  };
  
  /**
   * Format simulation results into a readable summary
   * @param {Object} results - Simulation results from API
   * @returns {string} - Formatted results summary
   */
  export const formatSimulationResults = (results) => {
    if (!results || Object.keys(results).length === 0) {
      return "No simulation results available.";
    }
    
    try {
      let summary = "# Simulation Results Summary\n\n";
      
      // System metrics
      if (results.system_metrics) {
        summary += "## System Metrics\n";
        const systemMetrics = results.system_metrics;
        summary += `- Overall Utilization: ${(systemMetrics.system_utilization * 100).toFixed(2)}%\n`;
        summary += `- Average Queue Length: ${systemMetrics.avg_system_queue.toFixed(2)}\n`;
        summary += `- Average Wait Time: ${systemMetrics.avg_system_wait.toFixed(2)}\n`;
        summary += `- System Throughput: ${systemMetrics.system_throughput.toFixed(2)}\n\n`;
      }
      
      // Node metrics
      if (results.node_metrics && Array.isArray(results.node_metrics)) {
        summary += "## Node Performance\n\n";
        
        results.node_metrics.forEach((node, index) => {
          summary += `### Node ${index}: ${node.name || `Node ${index}`}\n`;
          summary += `- Utilization: ${(node.utilization * 100).toFixed(2)}%\n`;
          summary += `- Average Queue Length: ${node.avg_queue_length.toFixed(2)}\n`;
          summary += `- Average Wait Time: ${node.avg_wait_time.toFixed(2)}\n`;
          summary += `- Throughput: ${node.throughput.toFixed(2)}\n\n`;
        });
      }
      
      return summary;
    } catch (error) {
      console.error('Error formatting results:', error);
      return `Error formatting results: ${error.message}`;
    }
  };