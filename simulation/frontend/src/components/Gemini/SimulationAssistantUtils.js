/**
 * Utility functions to help the AI assistant analyze simulation results 
 * and provide recommendations
 */

/**
 * Analyzes simulation results and returns insights
 * @param {Object} results - The simulation results object
 * @returns {Object} Analysis with insights and recommendations
 */
export const analyzeSimulationResults = (results) => {
    if (!results || !results.analysis) {
      return {
        insights: [],
        recommendations: [],
        summary: "No simulation results to analyze."
      };
    }
    
    const insights = [];
    const recommendations = [];
    
    try {
      const systemStats = results.analysis.system_stats;
      const nodeStats = results.analysis.node_statistics;
      const utilization = results.utilization;
      
      // System-level insights
      if (systemStats) {
        // Check overall waiting time
        const avgWaitTime = systemStats.overall_waiting_time?.mean || 0;
        if (avgWaitTime > 10) {
          insights.push(`Average waiting time (${avgWaitTime.toFixed(2)} min) is high across the system.`);
          recommendations.push("Consider adding more servers to reduce wait times.");
        }
        
        // Check overall flow time
        const avgFlowTime = systemStats.overall_flow_time?.mean || 0;
        if (avgFlowTime > 15) {
          insights.push(`Average customer time in system (${avgFlowTime.toFixed(2)} min) is significant.`);
          recommendations.push("Look for bottleneck nodes that might be slowing down overall throughput.");
        }
      }
      
      // Node-level analysis
      if (nodeStats && utilization) {
        // Find bottlenecks (high utilization)
        const bottlenecks = [];
        const underutilized = [];
        const highWaitTimes = [];
        
        Object.entries(nodeStats).forEach(([nodeId, stats]) => {
          const nodeIndex = parseInt(nodeId) - 1;
          const nodeUtil = utilization[nodeIndex]?.utilization_rate || 0;
          const nodeName = `Node ${nodeId}`;
          const waitTime = stats.waiting_time?.mean || 0;
          
          // Check utilization
          if (nodeUtil > 0.85) {
            bottlenecks.push({
              node: nodeName,
              utilization: nodeUtil,
              waitTime: waitTime
            });
            
            insights.push(`${nodeName} has high utilization (${(nodeUtil * 100).toFixed(1)}%).`);
          } 
          else if (nodeUtil < 0.3 && nodeId !== "1") { // Ignore entry nodes which might have low utilization
            underutilized.push({
              node: nodeName,
              utilization: nodeUtil
            });
            
            insights.push(`${nodeName} has low utilization (${(nodeUtil * 100).toFixed(1)}%).`);
          }
          
          // Check wait times
          if (waitTime > 5) {
            highWaitTimes.push({
              node: nodeName,
              waitTime: waitTime
            });
            
            insights.push(`${nodeName} has high average wait time (${waitTime.toFixed(2)} min).`);
          }
        });
        
        // Generate specific recommendations for bottlenecks
        if (bottlenecks.length > 0) {
          bottlenecks.forEach(bottleneck => {
            recommendations.push(`Consider adding servers to ${bottleneck.node} to reduce its high utilization (${(bottleneck.utilization * 100).toFixed(1)}%).`);
          });
        }
        
        // Recommendations for underutilized nodes
        if (underutilized.length > 0) {
          underutilized.forEach(node => {
            recommendations.push(`${node.node} is underutilized (${(node.utilization * 100).toFixed(1)}%). Consider reducing servers or redirecting traffic to this node.`);
          });
        }
        
        // Recommendations for high wait times
        if (highWaitTimes.length > 0 && highWaitTimes.length !== bottlenecks.length) {
          // Only add this if not already covered by bottleneck recommendations
          const waitTimeNodes = highWaitTimes
            .filter(n => !bottlenecks.find(b => b.node === n.node))
            .map(n => n.node)
            .join(", ");
            
          if (waitTimeNodes) {
            recommendations.push(`Reduce queuing at ${waitTimeNodes} to improve customer wait times.`);
          }
        }
      }
      
      // If no specific insights were found
      if (insights.length === 0) {
        insights.push("The simulation appears to be running efficiently with no major issues detected.");
      }
      
      if (recommendations.length === 0) {
        recommendations.push("No specific improvements needed; the current configuration appears optimal.");
      }
      
      // Generate a summary
      const summary = generateSummary(results, insights, recommendations);
      
      return {
        insights,
        recommendations,
        summary
      };
    } catch (error) {
      console.error("Error analyzing simulation results:", error);
      return {
        insights: ["Error analyzing simulation results."],
        recommendations: ["Try running the simulation again with different parameters."],
        summary: "Could not analyze simulation results due to an error."
      };
    }
  };
  
  /**
   * Generates a summary of the simulation results
   * @param {Object} results - The simulation results 
   * @param {Array} insights - Insights derived from analysis
   * @param {Array} recommendations - Recommendations based on analysis
   * @returns {string} A formatted summary
   */
  const generateSummary = (results, insights, recommendations) => {
    try {
      const systemStats = results.analysis.system_stats;
      
      // Key metrics
      // Correct customer count calculation in analyzeSimulationResults function
      const totalCustomers = systemStats.total_completed || 0; // Use completed count instead of total
      const avgWaitTime = systemStats.overall_waiting_time?.mean || 0;
      const avgServiceTime = systemStats.overall_service_time?.mean || 0;
      const avgFlowTime = systemStats.overall_flow_time?.mean || 0;
      
      // Utilization information
      let avgUtilization = 0;
      let highestUtilNode = { id: 0, utilization: 0 };
      let lowestUtilNode = { id: 0, utilization: 1 };
      
      if (results.utilization) {
        const utils = Object.entries(results.utilization).map(([idx, data]) => {
          const nodeId = parseInt(idx) + 1;
          const util = data.utilization_rate;
          
          if (util > highestUtilNode.utilization) {
            highestUtilNode = { id: nodeId, utilization: util };
          }
          
          if (util < lowestUtilNode.utilization && util > 0) {
            lowestUtilNode = { id: nodeId, utilization: util };
          }
          
          return util;
        });
        
        avgUtilization = utils.reduce((sum, val) => sum + val, 0) / utils.length;
      }
      
      // Format the summary
      let summary = `## Simulation Results Summary\n\n`;
      
      summary += `This simulation processed **${totalCustomers}** customers with an average wait time of ` +
        `**${avgWaitTime.toFixed(2)} minutes** and service time of **${avgServiceTime.toFixed(2)} minutes**.\n\n`;
        
      summary += `Total average time in system (flow time): **${avgFlowTime.toFixed(2)} minutes**.\n\n`;
      
      summary += `Average utilization across all nodes: **${(avgUtilization * 100).toFixed(1)}%**\n\n`;
      
      if (highestUtilNode.id > 0) {
        summary += `Highest utilization: **Node ${highestUtilNode.id}** at ` +
          `**${(highestUtilNode.utilization * 100).toFixed(1)}%**\n\n`;
      }
      
      // Key insights section
      if (insights.length > 0) {
        summary += `### Key Insights\n\n`;
        insights.forEach(insight => {
          summary += `- ${insight}\n`;
        });
        summary += `\n`;
      }
      
      // Recommendations section
      if (recommendations.length > 0) {
        summary += `### Recommendations\n\n`;
        recommendations.forEach(rec => {
          summary += `- ${rec}\n`;
        });
      }
      
      return summary;
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Could not generate a summary due to an error in the results format.";
    }
  };
  
  /**
   * Integrates with the AI assistant to analyze simulation results
   * @param {Object} results - Simulation results object
   * @returns {string} Formatted analysis for the AI to use in responses
   */
  export const getAIAnalysisForSimulation = (results) => {
    const analysis = analyzeSimulationResults(results);
    return analysis.summary;
  };