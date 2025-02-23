/**
 * Utility functions to help the AI assistant analyze simulation results 
 * and provide recommendations
 */

import { processSimulationData, filterSimulationData } from '../Dashboard/simulationDataProcessor.js';
import { formatSimulationResults } from './AISimulationUtils.js';

/**
 * Analyzes simulation results and returns insights
 * @param {Object} results - The simulation results object
 * @returns {Object} Analysis with insights and recommendations
 */
export const analyzeSimulationResults = (results) => {
  if (!results || !results.runs || !results.runs.length) {
    return {
      insights: [],
      recommendations: [],
      summary: "No simulation results to analyze."
    };
  }

  const insights = [];
  const recommendations = [];
  const runCount = results.runs.length;

  try {
    // Filter and process data the same way the dashboard does
    const processedData = filterSimulationData(results, 'all', [0, 100], 'all');
    
    if (!processedData || !processedData.system) {
      throw new Error("Could not process simulation data");
    }

    // Add context about multiple runs
    insights.push(`Analysis based on ${runCount} simulation runs for greater statistical confidence.`);

    // System-wide metrics
    const systemStats = processedData.system;
    insights.push(`System processed ${systemStats.total_customers.toLocaleString()} transactions with:`);
    insights.push(`- Average waiting time: ${(systemStats.overall_waiting_time.mean / 60).toFixed(2)} minutes`);
    insights.push(`- Average service time: ${(systemStats.overall_service_time.mean).toFixed(1)} seconds`);
    insights.push(`- Average flow time: ${(systemStats.overall_flow_time.mean / 60).toFixed(2)} minutes`);

    // Analyze nodes using the already-averaged data
    processedData.nodes.forEach(node => {
      insights.push(`\n${node.name}:`);
      insights.push(`- Utilization: ${(node.utilization * 100).toFixed(1)}%`);
      insights.push(`- Average wait time: ${(node.waitTime / 60).toFixed(2)} minutes`);
      insights.push(`- Average queue length: ${node.avgQueue.toFixed(2)} transactions`);
      insights.push(`- Throughput: ${node.throughput.completed.toFixed(1)} transactions completed`);

      // Generate recommendations based on metrics
      if (node.utilization > 0.85) {
        recommendations.push(`🔸 High utilization (${(node.utilization * 100).toFixed(1)}%) at ${node.name}. Consider adding more servers.`);
      }
      if (node.waitTime > 600) { // 10 minutes in seconds
        recommendations.push(`🔸 Long wait times (${(node.waitTime / 60).toFixed(2)} min) at ${node.name}. Consider optimizing service time or adding capacity.`);
      }
      if (node.avgQueue > 5) {
        recommendations.push(`🔸 Long queues (avg ${node.avgQueue.toFixed(1)} transactions) at ${node.name}. Consider process improvements.`);
      }
    });

    // System-wide recommendations based on averages
    if (systemStats.overall_waiting_time.mean > 900) { // 15 minutes in seconds
      recommendations.push('🔸 System-wide waiting times are high. Consider a general capacity increase.');
    }

    // Add 90th percentile insights
    insights.push('\nPerformance at 90th percentile:');
    insights.push(`- Wait time: ${(systemStats.overall_waiting_time.percentiles['90'] / 60).toFixed(2)} minutes`);
    insights.push(`- Service time: ${systemStats.overall_service_time.percentiles['90'].toFixed(1)} seconds`);
    insights.push(`- Flow time: ${(systemStats.overall_flow_time.percentiles['90'] / 60).toFixed(2)} minutes`);

    return {
      insights,
      recommendations,
      summary: generateSummary(results, insights, recommendations)
    };
  } catch (error) {
    console.error("Error analyzing simulation results:", error);
    return {
      insights: ["Error analyzing simulation results."],
      recommendations: ["Please try running the simulation again."],
      summary: "Could not analyze simulation results due to an error."
    };
  }
};

/**
 * Generates a formatted summary of the simulation analysis
 */
const generateSummary = (results, insights, recommendations) => {
  const runCount = results.runs.length;
  let summary = `## Simulation Analysis Summary\n\n`;
  
  summary += `This analysis is based on ${runCount} simulation runs to ensure statistical reliability.\n\n`;
  
  summary += `### Key Insights\n\n`;
  insights.forEach(insight => {
    if (insight.startsWith('\n')) {
      summary += `\n${insight.trim()}\n`;
    } else {
      summary += `- ${insight}\n`;
    }
  });
  
  if (recommendations.length > 0) {
    summary += `\n### Recommendations\n\n`;
    recommendations.forEach(rec => {
      summary += `${rec}\n`;
    });
  }
  
  return summary;
};

export const getAIAnalysisForSimulation = (results) => {
  if (!results) {
    return "No simulation results available to analyze.";
  }
  const analysis = analyzeSimulationResults(results);
  return analysis.summary;
};

export const handleSimulationResultUpdate = (results, setMessages) => {
  if (!results) return;
  
  const analysis = getAIAnalysisForSimulation(results);
  
  setMessages(prev => {
    const newMessages = [...prev];
    newMessages.push({
      role: 'assistant',
      content: analysis
    });
    return newMessages;
  });
};