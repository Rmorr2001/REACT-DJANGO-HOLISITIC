// Data processing utilities for simulation results

/**
 * Main function to process simulation data for display
 */
export const processSimulationData = (results) => {
  if (!results || (!results.transactions && !results.runs)) {
    return {
      nodes: [],
      utilization: [],
      waitTime: [],
      serviceTime: [],
      throughput: [],
      system: {
        total_customers: 0,
        overall_service_time: { mean: 0, percentiles: { '90': 0 } },
        overall_waiting_time: { mean: 0, percentiles: { '90': 0 } },
        overall_flow_time: { mean: 0, percentiles: { '90': 0 } }
      }
    };
  }

  // Get node names from metadata
  const nodeNames = results.metadata?.node_names || {};
  const numServers = results.configuration?.number_of_servers || [];

  // Process transactions
  const completedTransactions = results.transactions?.filter(t => t.exit_time !== null) || [];

  // Calculate node statistics
  const nodeStats = processNodeStatistics(results, completedTransactions, nodeNames, numServers);

  // Calculate system-wide statistics
  const systemStats = calculateSystemStats(completedTransactions);

  return {
    nodes: nodeStats,
    utilization: nodeStats.map(node => ({
      name: node.name,
      utilization: node.utilization * 100
    })),
    waitTime: nodeStats.map(node => ({
      name: node.name,
      waitTime: node.waitTime
    })),
    serviceTime: nodeStats.map(node => ({
      name: node.name,
      serviceTime: node.serviceTime
    })),
    throughput: nodeStats.map(node => ({
      name: node.name,
      arrivals: node.throughput.arrivals,
      completed: node.throughput.completed
    })),
    system: systemStats
  };
};

/**
 * Filter simulation data based on selected criteria
 */
export const filterSimulationData = (results, selectedNode, completionRange, selectedRun) => {
  if (!results) return null;

  // Handle multi-run results
  let processData;
  if (results.runs && Array.isArray(results.runs)) {
    if (selectedRun === 'all') {
      processData = averageRunResults(results.runs);
    } else {
      processData = results.runs.find(run => 
        run?.metadata?.run_number === selectedRun
      );
    }
    if (!processData) return null;
  } else {
    processData = results; // Single run data
  }

  // Ensure transactions exist and are an array
  if (!processData.transactions || !Array.isArray(processData.transactions)) {
    return null;
  }

  // Filter transactions
  let filteredTransactions = [...processData.transactions];

  // Apply node filter
  if (selectedNode !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t?.node_id === selectedNode);
  }

  // Apply completion range filter
  if (completionRange && Array.isArray(completionRange) && completionRange.length === 2) {
    const [start, end] = completionRange;
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => ((a?.exit_time || Infinity) - (b?.exit_time || Infinity))
    );
    
    const startIndex = Math.floor((start / 100) * sortedTransactions.length);
    const endIndex = Math.ceil((end / 100) * sortedTransactions.length);
    filteredTransactions = sortedTransactions.slice(startIndex, endIndex);
  }

  // Create filtered results object with safe defaults
  const filtered = {
    ...processData,
    transactions: filteredTransactions,
    summary_stats: recalculateStats(filteredTransactions),
    metadata: processData.metadata || {},
    configuration: processData.configuration || {}
  };

  return processSimulationData(filtered);
};

/**
 * Average results across multiple simulation runs
 */
const averageRunResults = (runs) => {
  if (!runs || !Array.isArray(runs) || runs.length === 0) return null;

  // Initialize empty stats object
  const avgStats = {};
  let totalCustomers = 0;

  // First pass - sum up all values
  runs.forEach(run => {
    if (run?.summary_stats) {
      // Add to total customers count
      totalCustomers += run.transactions?.length || 0;

      Object.entries(run.summary_stats).forEach(([nodeId, stats]) => {
        if (!avgStats[nodeId]) {
          avgStats[nodeId] = {
            waiting_time_stats: createEmptyStats(),
            service_time_stats: createEmptyStats(),
            flow_time_stats: createEmptyStats(),
            queue_size_stats: createEmptyStats(),
            throughput: { arrivals: 0, completed: 0 }
          };
        }
        
        // Sum up all metrics
        ['waiting_time_stats', 'service_time_stats', 'flow_time_stats', 'queue_size_stats'].forEach(statType => {
          if (stats[statType]) {
            Object.entries(stats[statType]).forEach(([metric, value]) => {
              if (typeof value === 'number') {
                avgStats[nodeId][statType][metric] = 
                  (avgStats[nodeId][statType][metric] || 0) + value;
              } else if (value && typeof value === 'object' && value.percentiles) {
                avgStats[nodeId][statType].percentiles = avgStats[nodeId][statType].percentiles || {};
                Object.entries(value.percentiles).forEach(([percentile, val]) => {
                  avgStats[nodeId][statType].percentiles[percentile] = 
                    (avgStats[nodeId][statType].percentiles[percentile] || 0) + val;
                });
              }
            });
          }
        });

        // Sum up throughput
        if (stats.throughput) {
          avgStats[nodeId].throughput.arrivals += stats.throughput.arrivals || 0;
          avgStats[nodeId].throughput.completed += stats.throughput.completed || 0;
        }
      });
    }
  });

  // Second pass - calculate averages
  Object.values(avgStats).forEach(nodeStats => {
    ['waiting_time_stats', 'service_time_stats', 'flow_time_stats', 'queue_size_stats'].forEach(statType => {
      Object.keys(nodeStats[statType]).forEach(metric => {
        if (typeof nodeStats[statType][metric] === 'number') {
          nodeStats[statType][metric] /= runs.length;
        } else if (nodeStats[statType][metric]?.percentiles) {
          Object.keys(nodeStats[statType][metric].percentiles).forEach(percentile => {
            nodeStats[statType][metric].percentiles[percentile] /= runs.length;
          });
        }
      });
    });

    // Average throughput
    nodeStats.throughput.arrivals /= runs.length;
    nodeStats.throughput.completed /= runs.length;
  });

  return {
    transactions: runs[0].transactions, // Keep transactions from first run as reference
    summary_stats: avgStats,
    metadata: {
      ...runs[0].metadata,
      run_number: 'average',
      seed: 'all',
      total_transactions: Math.round(totalCustomers / runs.length)
    },
    configuration: runs[0].configuration
  };
};

/**
 * Process statistics for individual nodes
 */
const processNodeStatistics = (results, completedTransactions, nodeNames, numServers) => {
  const nodeStats = {};
  const summary = results.summary_stats || {};

  // Initialize statistics for each node
  Object.entries(summary).forEach(([nodeId, stats]) => {
    const numericNodeId = parseInt(nodeId);
    const nodeIndex = numericNodeId - 1;
    
    const nodeTransactions = completedTransactions.filter(t => t.node_id === numericNodeId);
    const totalTime = results.metadata?.simulation_duration || 1440;
    const numServerForNode = numServers[nodeIndex] || 1;
    
    // Calculate utilization
    const avgServiceTime = stats.service_time_stats?.mean || 0;
    const utilization = Math.min(1, (avgServiceTime * nodeTransactions.length) / (totalTime * numServerForNode));

    nodeStats[nodeId] = {
      id: numericNodeId,
      name: nodeNames[nodeIndex] || `Node ${numericNodeId}`,
      servers: numServerForNode,
      utilization: utilization,
      waitTime: stats.waiting_time_stats?.mean || 0,
      serviceTime: stats.service_time_stats?.mean || 0,
      flowTime: stats.flow_time_stats?.mean || 0,
      avgQueue: stats.queue_size_stats?.mean || 0,
      throughput: {
        arrivals: results.transactions.filter(t => t.node_id === numericNodeId).length,
        completed: nodeTransactions.length
      }
    };
  });

  return Object.values(nodeStats);
};

/**
 * Calculate system-wide statistics
 */
const calculateSystemStats = (completedTransactions) => {
  return {
    total_customers: completedTransactions.length,
    overall_service_time: {
      mean: calculateMean(completedTransactions.map(t => t.service_time)),
      percentiles: calculatePercentiles(completedTransactions.map(t => t.service_time))
    },
    overall_waiting_time: {
      mean: calculateMean(completedTransactions.map(t => t.waiting_time)),
      percentiles: calculatePercentiles(completedTransactions.map(t => t.waiting_time))
    },
    overall_flow_time: {
      mean: calculateMean(completedTransactions.map(t => t.flow_time)),
      percentiles: calculatePercentiles(completedTransactions.map(t => t.flow_time))
    }
  };
};

/**
 * Recalculate statistics for filtered data
 */
const recalculateStats = (transactions) => {
  const statsByNode = {};

  // Group transactions by node
  transactions.forEach(txn => {
    if (!statsByNode[txn.node_id]) {
      statsByNode[txn.node_id] = {
        waiting_times: [],
        service_times: [],
        flow_times: [],
        queue_sizes: []
      };
    }
    
    const nodeStats = statsByNode[txn.node_id];
    if (txn.waiting_time !== null) nodeStats.waiting_times.push(txn.waiting_time);
    if (txn.service_time !== null) nodeStats.service_times.push(txn.service_time);
    if (txn.flow_time !== null) nodeStats.flow_times.push(txn.flow_time);
    if (txn.queue_size_at_arrival !== null) nodeStats.queue_sizes.push(txn.queue_size_at_arrival);
  });

  // Calculate statistics for each node
  return Object.fromEntries(
    Object.entries(statsByNode).map(([nodeId, stats]) => [
      nodeId,
      {
        waiting_time_stats: calculateTimeStats(stats.waiting_times),
        service_time_stats: calculateTimeStats(stats.service_times),
        flow_time_stats: calculateTimeStats(stats.flow_times),
        queue_size_stats: calculateTimeStats(stats.queue_sizes)
      }
    ])
  );
};

/**
 * Calculate time-based statistics
 */
const calculateTimeStats = (values) => {
  const validValues = values.filter(v => v !== null && v !== undefined);
  
  if (validValues.length === 0) {
    return createEmptyStats();
  }

  const sorted = [...validValues].sort((a, b) => a - b);
  return {
    mean: calculateMean(validValues),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std_dev: calculateStdDev(validValues),
    percentiles: calculatePercentiles(sorted)
  };
};

/**
 * Helper functions for statistical calculations
 */
const calculateMean = (values) => {
  const validValues = values.filter(v => v !== null && v !== undefined);
  return validValues.length ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
};

const calculateStdDev = (values) => {
  const mean = calculateMean(values);
  const validValues = values.filter(v => v !== null && v !== undefined);
  if (validValues.length <= 1) return 0;
  
  const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (validValues.length - 1);
  return Math.sqrt(variance);
};

const calculatePercentiles = (sortedValues) => {
  if (!sortedValues.length) return createEmptyStats().percentiles;
  
  const getPercentile = (p) => {
    const index = Math.floor(sortedValues.length * (p / 100));
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  };

  return {
    '10': getPercentile(10),
    '25': getPercentile(25),
    '50': getPercentile(50),
    '75': getPercentile(75),
    '90': getPercentile(90),
    '95': getPercentile(95),
    '99': getPercentile(99)
  };
};

/**
 * Create empty statistics object
 */
const createEmptyStats = () => ({
  mean: 0,
  min: 0,
  max: 0,
  std_dev: 0,
  percentiles: {
    '10': 0,
    '25': 0,
    '50': 0,
    '75': 0,
    '90': 0,
    '95': 0,
    '99': 0
  }
});