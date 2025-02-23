import React from 'react';
import { Paper, Typography, Box, Tooltip as MuiTooltip } from '@mui/material';
import { Info as InfoIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar
} from 'recharts';

const CustomTooltip = ({ active, payload, label, isTime = false }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const value = payload[0].value;
  const ci = data.confidenceInterval;

  return (
    <div className="custom-tooltip" style={{ 
      backgroundColor: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '4px'
    }}>
      <p style={{ margin: '0 0 5px 0' }}><strong>{label}</strong></p>
      <p style={{ margin: '0 0 5px 0' }}>
        {payload.map(item => (
          <span key={item.name} style={{ color: item.color }}>
            {item.name}: {isTime ? formatTime(item.value) : `${item.value.toFixed(1)}${item.unit || ''}`}
          </span>
        ))}
      </p>
      {ci && (
        <p style={{ margin: '0', fontSize: '0.9em', color: '#666' }}>
          95% CI: {isTime ? 
            `${formatTime(ci.lower)} - ${formatTime(ci.upper)}` : 
            `${ci.lower.toFixed(1)} - ${ci.upper.toFixed(1)}${payload[0].unit || ''}`}
        </p>
      )}
    </div>
  );
};

const ChartSection = ({ title, tooltip, children }) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" component="h3">
        {title}
      </Typography>
      <MuiTooltip title={tooltip}>
        <InfoIcon size={16} style={{ marginLeft: '8px' }} />
      </MuiTooltip>
    </Box>
    <Box sx={{ height: 300 }}>
      {children}
    </Box>
  </Paper>
);

const NodeCharts = ({ chartData, metadata }) => {
  if (!chartData) return null;

  const { utilization, waitTime, serviceTime, throughput } = chartData;
  const runCount = metadata?.runCount || 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Utilization Chart */}
      <ChartSection 
        title="Node Utilization"
        tooltip={`Percentage of time servers at each node are busy (based on ${runCount} runs)`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={utilization} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="utilization" 
              fill="#8884d8" 
              name="Utilization"
              unit="%"
            >
              {runCount > 1 && (
                <ErrorBar
                  dataKey="confidenceInterval"
                  width={4}
                  strokeWidth={2}
                  stroke="#666"
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Wait & Service Times Chart */}
      <ChartSection 
        title="Wait & Service Times"
        tooltip={`Average waiting and service times for each node (based on ${runCount} runs)`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waitTime?.map((item, index) => ({
            name: item.name,
            waitTime: item.waitTime,
            waitTimeCI: item.confidenceInterval,
            serviceTime: serviceTime[index]?.serviceTime,
            serviceTimeCI: serviceTime[index]?.confidenceInterval
          }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip content={(props) => <CustomTooltip {...props} isTime />} />
            <Legend />
            <Bar dataKey="waitTime" fill="#ff9800" name="Wait Time">
              {runCount > 1 && (
                <ErrorBar dataKey="waitTimeCI" width={4} strokeWidth={2} stroke="#666" />
              )}
            </Bar>
            <Bar dataKey="serviceTime" fill="#4caf50" name="Service Time">
              {runCount > 1 && (
                <ErrorBar dataKey="serviceTimeCI" width={4} strokeWidth={2} stroke="#666" />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Throughput Chart */}
      <ChartSection 
        title="Node Throughput"
        tooltip={`Number of customers arriving and completed at each node (based on ${runCount} runs)`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={throughput} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Customers', angle: -90, position: 'insideLeft' }} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="arrivals" fill="#2196f3" name="Arrivals">
              {runCount > 1 && (
                <ErrorBar dataKey="arrivalsCI" width={4} strokeWidth={2} stroke="#666" />
              )}
            </Bar>
            <Bar dataKey="completed" fill="#3f51b5" name="Completed">
              {runCount > 1 && (
                <ErrorBar dataKey="completedCI" width={4} strokeWidth={2} stroke="#666" />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>
    </Box>
  );
};

// Helper function for time formatting
const formatTime = (minutes) => {
  if (minutes === undefined || minutes === null) return 'N/A';
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
};

export default NodeCharts;