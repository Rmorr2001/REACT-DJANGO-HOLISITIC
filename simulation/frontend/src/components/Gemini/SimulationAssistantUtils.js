/**
 * Utility functions to help the AI assistant analyze simulation results 
 * and provide recommendations
 */

import { processSimulationData } from '../Dashboard/simulationDataProcessor.js';
import { formatSimulationResults } from './AISimulationUtils.js';

/**
 * Analyzes simulation results and returns insights
 * @param {Object} results - The simulation results object
 * @returns {Object} Analysis with insights and recommendations
 */
export const analyzeSimulationResults = (results) => {
  if (!results || !results.system_metrics) {
    return {
      insights: [],
      recommendations: [],
      summary: "No simulation results to analyze."
    };
  }
  
  const insights = [];
  const recommendations = [];
  
  try {
    const systemMetrics = results.system_metrics;
    const nodeMetrics = results.node_metrics;
    
    // System-level insights
    if (systemMetrics) {
      const systemUtil = systemMetrics.system_utilization;
      const avgWait = systemMetrics.avg_system_wait;
      const avgQueue = systemMetrics.avg_system_queue;
      
      if (systemUtil > 0.85) {
        insights.push(`System utilization is very high (${(systemUtil * 100).toFixed(1)}%).`);
        recommendations.push("Consider adding more capacity to the system.");
      }
      
      if (avgWait > 10) {
        insights.push(`Average system wait time (${avgWait.toFixed(2)} min) is high.`);
        recommendations.push("Look for bottlenecks in the system that may be causing delays.");
      }
    }
    
    // Node-level analysis
    if (nodeMetrics && Array.isArray(nodeMetrics)) {
      nodeMetrics.forEach((node, index) => {
        const nodeName = node.name || `Node ${index}`;
        
        if (node.utilization > 0.85) {
          insights.push(`${nodeName} has high utilization (${(node.utilization * 100).toFixed(1)}%).`);
          recommendations.push(`Consider adding more servers to ${nodeName}.`);
        }
        
        if (node.avg_wait_time > 5) {
          insights.push(`${nodeName} has high average wait time (${node.avg_wait_time.toFixed(2)} min).`);
        }
      });
    }
    
    // Add default insights if none found
    if (insights.length === 0) {
      insights.push("The simulation appears to be running efficiently with no major issues detected.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Current configuration appears optimal.");
    }
    
    return {
      insights,
      recommendations,
      summary: generateSummary(results, insights, recommendations)
    };
  } catch (error) {
    console.error("Error analyzing simulation results:", error);
    return {
      insights: ["Error analyzing simulation results."],
      recommendations: ["Try running the simulation again."],
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
    const systemMetrics = results.system_metrics;
    
    // Key metrics
    const totalCustomers = systemMetrics.total_customers || 0;
    const avgWaitTime = systemMetrics.avg_system_wait || 0;
    const avgServiceTime = systemMetrics.avg_service_time || 0;
    const systemUtil = systemMetrics.system_utilization || 0;
    
    // Format the summary
    let summary = `## Simulation Results Summary\n\n`;
    
    summary += `This simulation processed **${totalCustomers}** customers with:\n\n`;
    summary += `- Average wait time: **${avgWaitTime.toFixed(2)} minutes**\n`;
    summary += `- Average service time: **${avgServiceTime.toFixed(2)} minutes**\n`;
    summary += `- System utilization: **${(systemUtil * 100).toFixed(1)}%**\n\n`;
    
    // Node-specific metrics
    if (results.node_metrics && Array.isArray(results.node_metrics)) {
      summary += `### Node Performance\n\n`;
      results.node_metrics.forEach((node, index) => {
        summary += `**${node.name || `Node ${index + 1}`}**:\n`;
        summary += `- Utilization: ${(node.utilization * 100).toFixed(1)}%\n`;
        summary += `- Average wait time: ${node.avg_wait_time.toFixed(2)} min\n`;
        summary += `- Queue length: ${node.avg_queue_length.toFixed(2)}\n\n`;
      });
    }
    
    // Add insights and recommendations
    if (insights.length > 0) {
      summary += `### Key Insights\n\n`;
      insights.forEach(insight => summary += `- ${insight}\n`);
      summary += '\n';
    }
    
    if (recommendations.length > 0) {
      summary += `### Recommendations\n\n`;
      recommendations.forEach(rec => summary += `- ${rec}\n`);
    }
    
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Could not generate summary due to an error in the results format.";
  }
};
  
/**
 * Integrates with the AI assistant to analyze simulation results
 * @param {Object} results - Simulation results object
 * @returns {string} Formatted analysis for the AI to use in responses
 */
export const getAIAnalysisForSimulation = (results) => {
  const transformedResults = transformSimulationResults(results);
  if (!transformedResults) {
    return formatSimulationResults(results) || "No simulation results available to analyze.";
  }
  const analysis = analyzeSimulationResults(transformedResults);
  return analysis.summary;
};

export const handleSimulationResultUpdate = (results, setMessages) => {
  if (!results) return;
  
  const analysis = getAIAnalysisForSimulation(results);
  
  // Add the analysis directly as an assistant message
  setMessages(prev => {
    const newMessages = [...prev];
    newMessages.push({
      role: 'assistant',
      content: analysis
    });
    return newMessages;
  });
};

const transformSimulationResults = (rawResults) => {
  // First check if we have any results
  if (!rawResults || !rawResults.summary_stats) {
    return null;
  }

  // Process the raw data using the dashboard processor
  const processed = processSimulationData(rawResults);
  
  // Transform into the format expected by the analysis functions
  return {
    system_metrics: {
      system_utilization: processed.system.overall_service_time.mean / processed.system.overall_flow_time.mean || 0,
      avg_system_wait: processed.system.overall_waiting_time.mean || 0,
      avg_system_queue: processed.nodes.reduce((sum, node) => sum + (node.avgQueue || 0), 0) / processed.nodes.length,
      system_throughput: processed.nodes[0]?.throughput?.completed || 0,
      total_customers: processed.system.total_customers || 0
    },
    node_metrics: processed.nodes.map(node => ({
      name: node.name,
      utilization: node.utilization || 0,
      avg_wait_time: node.waitTime || 0,
      avg_queue_length: node.avgQueue || 0,
      throughput: node.throughput?.completed || 0
    }))
  };
};