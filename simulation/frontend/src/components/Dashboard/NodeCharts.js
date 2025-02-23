import React from 'react';
import { Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const NodeCharts = ({ chartData }) => {
  if (!chartData) return null;

  const { utilization, waitTime, serviceTime, throughput } = chartData;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Utilization Chart */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Node Utilization
          </Typography>
          <Tooltip title="Percentage of time servers at each node are busy">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={utilization}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <RechartsTooltip formatter={(value) => [`${value.toFixed(1)}%`, "Utilization"]} />
              <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Wait & Service Times Chart */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Wait & Service Times
          </Typography>
          <Tooltip title="Average waiting and service times for each node (minutes)">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={waitTime?.map((item, index) => ({
                name: item.name,
                waitTime: item.waitTime,
                serviceTime: serviceTime[index]?.serviceTime
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip formatter={(value) => [`${value.toFixed(2)} min`, ""]} />
              <Legend />
              <Bar dataKey="waitTime" fill="#ff9800" name="Wait Time" />
              <Bar dataKey="serviceTime" fill="#4caf50" name="Service Time" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Throughput Chart */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Node Throughput
          </Typography>
          <Tooltip title="Number of customers arriving and completed at each node">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={throughput}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Customers', angle: -90, position: 'insideLeft' }} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="arrivals" fill="#2196f3" name="Arrivals" />
              <Bar dataKey="completed" fill="#3f51b5" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default NodeCharts;