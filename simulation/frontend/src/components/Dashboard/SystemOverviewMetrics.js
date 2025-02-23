import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Tooltip } from '@mui/material';
import { 
  Users, 
  Clock, 
  TimerOff, 
  Timer,
  Info as InfoIcon 
} from 'lucide-react';

const formatTime = (minutes) => {
  if (minutes === undefined || minutes === null) return 'N/A';
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
};

const formatConfidenceInterval = (ci, isTime = false) => {
  if (!ci || !ci.lower || !ci.upper) return null;
  return `${formatTime(ci.lower)} - ${formatTime(ci.upper)}`;
};

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "primary.main",
  isTime = false,
  confidenceInterval = null,
  tooltip
}) => (
  <Card sx={{ height: '100%', boxShadow: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {Icon && (
          <Box sx={{ mr: 1, color }}>
            <Icon size={24} />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            <Tooltip title={tooltip}>
              <InfoIcon size={16} />
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Typography variant="h4" sx={{ mb: 1, color }}>
        {isTime ? formatTime(value) : value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}
      </Typography>

      {confidenceInterval && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          95% CI: {formatConfidenceInterval(confidenceInterval, isTime)}
        </Typography>
      )}

      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SystemOverviewMetrics = ({ stats, metadata }) => {
  if (!stats) return null;

  const metrics = [
    {
      title: "Total Transactions",
      value: stats.total_customers,
      subtitle: "Processed in simulation",
      icon: Users,
      confidenceInterval: stats.total_customers_ci,
      tooltip: "Total number of transactions. Each time a customer is processed, it is counted as a transaction. A customer can be processed multiple times if they pass through nodes multiple times."
    },
    {
      title: "Avg Service Time",
      value: stats.overall_service_time?.mean,
      subtitle: `90th percentile: ${formatTime(stats.overall_service_time?.percentiles?.['90'])}`,
      icon: Timer,
      color: "success.main",
      isTime: true,
      confidenceInterval: stats.overall_service_time?.confidence_interval,
      tooltip: "Average time spent receiving service at stations, excluding waiting time. The 90th percentile indicates that 90% of customers were served within this time"
    },
    {
      title: "Avg Waiting Time",
      value: stats.overall_waiting_time?.mean,
      subtitle: `90th percentile: ${formatTime(stats.overall_waiting_time?.percentiles?.['90'])}`,
      icon: TimerOff,
      color: "warning.main",
      isTime: true,
      confidenceInterval: stats.overall_waiting_time?.confidence_interval,
      tooltip: "Average time customers spent waiting in queues before receiving service. The 90th percentile shows the maximum wait time for 90% of customers"
    },
    {
      title: "Avg Flow Time",
      value: stats.overall_flow_time?.mean,
      subtitle: `90th percentile: ${formatTime(stats.overall_flow_time?.percentiles?.['90'])}`,
      icon: Clock,
      color: "info.main",
      isTime: true,
      confidenceInterval: stats.overall_flow_time?.confidence_interval,
      tooltip: "Total time spent in the system (service time + waiting time). This represents the complete customer journey from entry to exit"
    }
  ];

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} md={3} key={index}>
          <MetricCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );
};

export default SystemOverviewMetrics;