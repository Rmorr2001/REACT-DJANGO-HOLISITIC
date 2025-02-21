/**
 * Utility functions for AI to interact with simulation APIs
 */

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
    console.log('Input nodes:', nodes);
    console.log('Input edges:', edges);
    
    // Create a mapping of node IDs to indices
    const nodeIndices = {};
    nodes.forEach((node, index) => {
      const id = node.id || `node-${index}`;
      nodeIndices[id] = index;
    });
    
    // Create routing probabilities arrays initialized with zeros
    const apiNodes = nodes.map(node => {
      // Create a routing probabilities array with zeros for each node
      const routingProbabilities = new Array(nodes.length).fill(0);
      
      // Get service and arrival distributions, ensuring they're valid
      const serviceDistribution = normalizeDistribution(node.service_distribution || node.data?.serviceDist);
      const arrivalDistribution = normalizeDistribution(node.arrival_distribution || node.data?.arrivalDist);
      
      return {
        node_name: node.name || node.data?.name || `Node ${nodeIndices[node.id]}`,
        service_distribution: serviceDistribution,
        service_rate: parseFloat(node.service_rate || node.data?.serviceRate || 1.0),
        number_of_servers: parseInt(node.number_of_servers || node.data?.numberOfServers || 1),
        arrival_distribution: arrivalDistribution,
        arrival_rate: parseFloat(node.arrival_rate || node.data?.arrivalRate || 
          (nodeIndices[node.id] === 0 ? 1.0 : 0.0)),
        routing_probabilities: routingProbabilities
      };
    });
    
    // Fill in the actual probabilities from edges
    if (edges && edges.length > 0) {
      edges.forEach(edge => {
        const sourceId = edge.source;
        const targetId = edge.target;
        
        // Skip invalid edges
        if (!sourceId || !targetId) {
          console.warn('Edge missing source or target', edge);
          return;
        }
        
        // Get indices from the mapping
        const sourceIndex = nodeIndices[sourceId];
        const targetIndex = nodeIndices[targetId];
        
        if (sourceIndex !== undefined && targetIndex !== undefined) {
          // Extract weight from different possible formats
          let weight = 0.5;
          if (edge.weight !== undefined) {
            weight = parseFloat(edge.weight);
          } else if (edge.data && edge.data.weight !== undefined) {
            weight = parseFloat(edge.data.weight);
          }
          
          // Set the routing probability
          apiNodes[sourceIndex].routing_probabilities[targetIndex] = weight;
        } else {
          console.warn('Could not find node indices for edge', {
            edge, sourceIndex, targetIndex, nodeIndices
          });
        }
      });
    }
    
    console.log('Formatted API nodes:', apiNodes);
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