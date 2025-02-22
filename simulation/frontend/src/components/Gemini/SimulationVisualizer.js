import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SimulationVisualizer = ({ results }) => {
  const [nodeData, setNodeData] = useState([]);
  const [systemData, setSystemData] = useState({});
  const [selectedView, setSelectedView] = useState('utilization');
  
  useEffect(() => {
    if (!results || !results.analysis) return;
    
    // Process data for visualization
    processData(results);
  }, [results]);
  
  const processData = (results) => {
    // Process node data for charts
    const nodeStats = [];
    
    if (results.analysis.node_statistics && results.utilization) {
      Object.entries(results.analysis.node_statistics).forEach(([nodeId, stats]) => {
        const nodeIndex = parseInt(nodeId) - 1;
        const utilization = results.utilization[nodeIndex]?.utilization_rate || 0;
        
        nodeStats.push({
          name: `Node ${nodeId}`,
          utilization: utilization * 100,
          waitTime: stats.waiting_time?.mean || 0,
          serviceTime: stats.service_time?.mean || 0,
          flowTime: stats.flow_time?.mean || 0,
          throughput: stats.throughput?.completed || 0,
          queueLength: results.utilization[nodeIndex]?.avg_queue_length || 0
        });
      });
    }
    
    setNodeData(nodeStats);
    setSystemData(results.analysis.system_stats || {});
  };
  
  const renderUtilizationChart = () => {
    if (nodeData.length === 0) return null;
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={nodeData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Utilization']} />
            <Bar dataKey="utilization" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderTimeChart = () => {
    if (nodeData.length === 0) return null;
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={nodeData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value.toFixed(2)} min`, '']} />
            <Legend />
            <Bar dataKey="waitTime" fill="#ff9800" name="Wait Time" />
            <Bar dataKey="serviceTime" fill="#4caf50" name="Service Time" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderQueueChart = () => {
    if (nodeData.length === 0) return null;
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={nodeData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Avg Queue Length', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value.toFixed(2)}`, 'Avg Queue']} />
            <Bar dataKey="queueLength" fill="#2196f3" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const renderThroughputChart = () => {
    if (nodeData.length === 0) return null;
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={nodeData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Customers', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value}`, 'Customers']} />
            <Bar dataKey="throughput" fill="#3f51b5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render a message if no data is available
  if (!results || !results.analysis) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No simulation data available. Run a simulation to see results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Simulation Results Visualization</h2>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium mb-2">System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-xl font-semibold">{systemData.total_customers || 'N/A'}</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Avg Wait Time</p>
              <p className="text-xl font-semibold">
                {systemData.overall_waiting_time?.mean 
                  ? `${systemData.overall_waiting_time.mean.toFixed(2)} min`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Avg Service Time</p>
              <p className="text-xl font-semibold">
                {systemData.overall_service_time?.mean 
                  ? `${systemData.overall_service_time.mean.toFixed(2)} min`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <p className="text-sm text-gray-500">Avg Flow Time</p>
              <p className="text-xl font-semibold">
                {systemData.overall_flow_time?.mean 
                  ? `${systemData.overall_flow_time.mean.toFixed(2)} min`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 font-medium ${selectedView === 'utilization' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setSelectedView('utilization')}
          >
            Utilization
          </button>
          <button 
            className={`px-4 py-2 font-medium ${selectedView === 'times' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setSelectedView('times')}
          >
            Wait/Service Times
          </button>
          <button 
            className={`px-4 py-2 font-medium ${selectedView === 'queues' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setSelectedView('queues')}
          >
            Queue Lengths
          </button>
          <button 
            className={`px-4 py-2 font-medium ${selectedView === 'throughput' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setSelectedView('throughput')}
          >
            Throughput
          </button>
        </div>
        
        <div className="mt-4">
          {selectedView === 'utilization' && renderUtilizationChart()}
          {selectedView === 'times' && renderTimeChart()}
          {selectedView === 'queues' && renderQueueChart()}
          {selectedView === 'throughput' && renderThroughputChart()}
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Key Insights</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <ul className="list-disc pl-5 space-y-1">
            {nodeData.length > 0 ? (
              <>
                {nodeData.some(node => node.utilization > 80) && (
                  <li>High utilization detected in one or more nodes (>80%), which may cause bottlenecks.</li>
                )}
                {nodeData.some(node => node.waitTime > 5) && (
                  <li>Long wait times (>5 min) observed in some nodes, consider adding more servers.</li>
                )}
                {nodeData.some(node => node.queueLength > 3) && (
                  <li>Long average queues detected, which may indicate capacity issues.</li>
                )}
                {nodeData.some(node => node.utilization < 30) && (
                  <li>Some nodes have low utilization (<30%), which may indicate resource inefficiency.</li>
                )}
                <li>
                  Highest utilization: {nodeData.reduce((max, node) => 
                    node.utilization > max.utilization ? node : max, nodeData[0]).name} 
                  ({nodeData.reduce((max, node) => 
                    node.utilization > max.utilization ? node : max, nodeData[0]).utilization.toFixed(1)}%)
                </li>
                <li>
                  Longest wait time: {nodeData.reduce((max, node) => 
                    node.waitTime > max.waitTime ? node : max, nodeData[0]).name}
                  ({nodeData.reduce((max, node) => 
                    node.waitTime > max.waitTime ? node : max, nodeData[0]).waitTime.toFixed(2)} min)
                </li>
              </>
            ) : (
              <li>No node-specific data available to analyze.</li>
            )}
            {systemData.overall_waiting_time?.mean > 10 && (
              <li>Overall system wait time is high. Consider optimizing the network structure.</li>
            )}
          </ul>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Recommendations</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <ul className="list-disc pl-5 space-y-1">
            {nodeData.some(node => node.utilization > 85) && (
              <li>Add servers to highly utilized nodes to reduce bottlenecks.</li>
            )}
            {nodeData.some(node => node.utilization < 30 && node.utilization > 0) && (
              <li>Redistribute resources from underutilized nodes to busier ones.</li>
            )}
            {nodeData.some(node => node.waitTime > 5) && (
              <li>Reduce service time or add more servers to nodes with long wait times.</li>
            )}
            {nodeData.length > 0 && (
              <li>Balance the network by ensuring utilization is similar across all nodes.</li>
            )}
            <li>Consider running multiple simulations with different configurations to find optimal settings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimulationVisualizer;