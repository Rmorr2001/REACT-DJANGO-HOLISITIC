// Data processing utilities for simulation results
export const processSimulationData = (results) => {
  if (!results || !results.transactions || !results.summary_stats) {
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

  // Calculate system-wide statistics
  const allTransactions = results.transactions || [];
  const completedTransactions = allTransactions.filter(t => t.exit_time !== null);

  const systemStats = {
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

  // Process nodes data
  const nodeStats = Object.entries(results.summary_stats).map(([nodeId, stats]) => {
    const numericNodeId = parseInt(nodeId);
    const nodeIndex = numericNodeId - 1; // Adjust index for node names
    
    // Calculate utilization as (service time * completed customers) / (total time * number of servers)
    const totalTime = results.metadata.simulation_duration || 1440; // Default to 24 hours in minutes
    const avgServiceTime = stats.service_time_stats?.mean || 0;
    const completedCustomers = completedTransactions.filter(t => t.node_id === numericNodeId).length;
    const numServerForNode = numServers[nodeIndex] || 1;
    
    const utilization = Math.min(1, (avgServiceTime * completedCustomers) / (totalTime * numServerForNode));

    return {
      id: numericNodeId,
      name: nodeNames[nodeIndex] || `Node ${numericNodeId}`,
      servers: numServers[nodeIndex] || 1,
      utilization: utilization,
      waitTime: stats.waiting_time_stats?.mean || 0,
      serviceTime: stats.service_time_stats?.mean || 0,
      flowTime: stats.flow_time_stats?.mean || 0,
      avgQueue: stats.queue_size_stats?.mean || 0,
      throughput: {
        arrivals: results.transactions.filter(t => t.node_id === numericNodeId).length,
        completed: completedCustomers
      }
    };
  });

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

const calculateMean = (values) => {
const validValues = values.filter(v => v !== null && v !== undefined);
return validValues.length ? 
  validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
};

const calculatePercentiles = (values) => {
const validValues = values.filter(v => v !== null && v !== undefined).sort((a, b) => a - b);
if (!validValues.length) return { '90': 0 };

const p90Index = Math.floor(validValues.length * 0.9);
return {
  '90': validValues[p90Index]
};
};

// Helper to filter simulation data
export const filterSimulationData = (results, selectedNode, completionRange) => {
if (!results || !results.transactions) return null;

let filtered = { ...results };
let filteredTransactions = [...results.transactions];

// Filter by node if specified
if (selectedNode !== 'all') {
  filteredTransactions = filteredTransactions.filter(t => t.node_id === selectedNode);
}

// Filter by completion range if specified
const totalTransactions = filteredTransactions.length;
if (completionRange && completionRange.length === 2) {
  const [start, end] = completionRange;
  const startIndex = Math.floor((start / 100) * totalTransactions);
  const endIndex = Math.ceil((end / 100) * totalTransactions);
  
  // Sort by completion time to get proper sequence
  filteredTransactions.sort((a, b) => 
    (a.exit_time || Infinity) - (b.exit_time || Infinity)
  );
  
  filteredTransactions = filteredTransactions.slice(startIndex, endIndex);
}

// Update filtered results with filtered transactions
filtered.transactions = filteredTransactions;

// Recalculate summary stats based on filtered data
filtered.summary_stats = recalculateStats(filteredTransactions);

return processSimulationData(filtered);
};

// Helper to recalculate statistics for filtered data
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
Object.entries(statsByNode).forEach(([nodeId, stats]) => {
  statsByNode[nodeId] = {
    waiting_time_stats: calculateTimeStats(stats.waiting_times),
    service_time_stats: calculateTimeStats(stats.service_times),
    flow_time_stats: calculateTimeStats(stats.flow_times),
    queue_size_stats: calculateTimeStats(stats.queue_sizes)
  };
});

return statsByNode;
};

// Helper to calculate time-based statistics
const calculateTimeStats = (values) => {
if (!values.length) return {
  mean: 0,
  min: 0,
  max: 0,
  percentiles: { '90': 0 }
};

const sorted = [...values].sort((a, b) => a - b);
return {
  mean: values.reduce((sum, v) => sum + v, 0) / values.length,
  min: sorted[0],
  max: sorted[sorted.length - 1],
  percentiles: {
    '90': sorted[Math.floor(sorted.length * 0.9)]
  }
};
};