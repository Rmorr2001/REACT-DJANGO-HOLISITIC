import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { BarChart as ChartIcon } from '@mui/icons-material';

// Helper function for formatting time
const formatTime = (minutes) => {
  if (minutes === undefined || minutes === null) return 'N/A';
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
};

// Custom card component for metrics
const MetricCard = ({ title, value, subtitle, isTime = false, isPercent = false, icon, color }) => (
  <Card sx={{ height: '100%', boxShadow: 2 }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && (
          <Box sx={{ mr: 1, color: color || 'primary.main' }}>
            {icon}
          </Box>
        )}
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ mb: 1, color: color || 'text.primary' }}>
        {isTime ? formatTime(value) : 
          isPercent ? `${(value * 100).toFixed(1)}%` : 
          typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 
          value || 'N/A'}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SystemOverviewMetrics = ({ stats }) => {
  if (!stats) return null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Total Customers"
          value={stats.total_customers}
          subtitle="Processed in simulation"
          icon={<ChartIcon />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Avg Service Time"
          value={stats.overall_service_time?.mean}
          subtitle={`90th percentile: ${stats.overall_service_time?.percentile_90?.toFixed(2) || 'N/A'}`}
          isTime={true}
          icon={<ChartIcon />}
          color="success.main"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Avg Waiting Time"
          value={stats.overall_waiting_time?.mean}
          subtitle={`90th percentile: ${stats.overall_waiting_time?.percentile_90?.toFixed(2) || 'N/A'}`}
          isTime={true}
          icon={<ChartIcon />}
          color="warning.main"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Avg Flow Time"
          value={stats.overall_flow_time?.mean}
          subtitle={`90th percentile: ${stats.overall_flow_time?.percentile_90?.toFixed(2) || 'N/A'}`}
          isTime={true}
          icon={<ChartIcon />}
          color="info.main"
        />
      </Grid>
    </Grid>
  );
};

export default SystemOverviewMetrics;