/**
 * Formats a time value in minutes to a human-readable string
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
export const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return 'N/A';
    if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    return `${(minutes / 60).toFixed(1)} hr`;
  };
  
  /**
   * Formats a decimal value as a percentage
   * @param {number} value - Decimal value (0-1)
   * @returns {string} Formatted percentage string
   */
  export const formatPercent = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  /**
   * Processes raw simulation results into chart-ready data
   * @param {Object} results - Raw simulation results from API
   * @returns {Object} Processed chart data
   */
  export const processChartData = (results) => {
    if (!results || !results.analysis) return {
      nodes: [],
      utilization: [],
      waitTime: [],
      serviceTime: [],
      throughput: [],
      system: {}
    };
    
    // Process node data for charts
    const nodeData = [];
    
    // Process utilization data for bar charts
    const utilizationData = [];
    const waitTimeData = [];
    const serviceTimeData = [];
    const throughputData = [];
    
    // Extract node statistics
    if (results.analysis.node_statistics) {
      Object.entries(results.analysis.node_statistics).forEach(([nodeId, stats], index) => {
        const nodeIndex = parseInt(nodeId) - 1;
        const utilization = results.utilization[nodeIndex]?.utilization_rate || 0;
        const waitTime = stats.waiting_time?.mean || 0;
        const serviceTime = stats.service_time?.mean || 0;
        
        // For utilization chart
        utilizationData.push({
          name: `Node ${nodeId}`,
          utilization: utilization * 100
        });
        
        // For wait time chart
        waitTimeData.push({
          name: `Node ${nodeId}`,
          waitTime: waitTime
        });
        
        // For service time chart
        serviceTimeData.push({
          name: `Node ${nodeId}`,
          serviceTime: serviceTime
        });
        
        // For throughput chart
        throughputData.push({
          name: `Node ${nodeId}`,
          arrivals: stats.throughput.arrivals,
          completed: stats.throughput.completed
        });
        
        // Combined data for node details
        nodeData.push({
          id: nodeId,
          utilization: utilization,
          avgQueue: results.utilization[nodeIndex]?.avg_queue_length || 0,
          waitTime: waitTime,
          serviceTime: serviceTime,
          throughput: stats.throughput,
          servers: results.utilization[nodeIndex]?.total_servers || 1
        });
      });
    }
    
    // Return all chart data
    return {
      nodes: nodeData,
      utilization: utilizationData,
      waitTime: waitTimeData,
      serviceTime: serviceTimeData,
      throughput: throughputData,
      system: results.analysis.system_stats || {}
    };
  };