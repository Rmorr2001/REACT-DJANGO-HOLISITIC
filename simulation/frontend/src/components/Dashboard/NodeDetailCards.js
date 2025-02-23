import React from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box, Divider, Tooltip } from '@mui/material';
import { Info as InfoIcon } from 'lucide-react';

const formatTime = (minutes) => {
  if (minutes === undefined || minutes === null) return 'N/A';
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
};

const formatPercent = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

const tooltips = {
  utilization: "Percentage of time the servers at this node are actively serving customers. Higher utilization indicates high resource usage efficiency but may lead to longer queues",
  avgQueue: "Average number of customers waiting to be served at this node. Longer queues suggest potential bottlenecks in the system",
  waitTime: "Average time customers spend waiting in the queue before being served at this node. This metric helps identify where customers experience the longest delays",
  serviceTime: "Average time taken to serve each customer at this node once they reach the front of the queue",
  throughput: {
    arrivals: "Total number of customers who arrived at this node during the simulation",
    completed: "Total number of customers who completed service at this node during the simulation"
  }
};

const StatItem = ({ label, value, confidenceInterval, isTime = false, isPercent = false, tooltip }) => (
  <Grid item xs={6}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        <Tooltip title={tooltip}>
          <InfoIcon size={14} />
        </Tooltip>
      </Typography>
      <Typography variant="body1" color="primary" sx={{ mt: 0.5 }}>
        {isTime ? formatTime(value) :
         isPercent ? formatPercent(value) :
         value?.toFixed(2) || 'N/A'}
      </Typography>
      {confidenceInterval && (
        <Typography variant="caption" color="textSecondary">
          CI: {isTime ? 
            `${formatTime(confidenceInterval.lower)} - ${formatTime(confidenceInterval.upper)}` :
            isPercent ?
            `${formatPercent(confidenceInterval.lower)} - ${formatPercent(confidenceInterval.upper)}` :
            `${confidenceInterval.lower.toFixed(2)} - ${confidenceInterval.upper.toFixed(2)}`}
        </Typography>
      )}
    </Box>
  </Grid>
);

const NodeDetailCards = ({ nodes }) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <Grid container spacing={2}>
      {nodes.map((node) => (
        <Grid item xs={12} md={6} lg={4} key={node.id}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardHeader 
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">{node.name}</Typography>
                  <Tooltip title="A node represents a service point in the system where customers receive service">
                    <InfoIcon size={16} />
                  </Tooltip>
                </Box>
              }
              subheader={`${node.servers} server${node.servers > 1 ? 's' : ''}`}
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <StatItem
                  label="Utilization"
                  value={node.utilization}
                  confidenceInterval={node.utilizationCI}
                  isPercent
                  tooltip={tooltips.utilization}
                />
                <StatItem
                  label="Avg Queue Length"
                  value={node.avgQueue}
                  confidenceInterval={node.queueLengthCI}
                  tooltip={tooltips.avgQueue}
                />
                <StatItem
                  label="Wait Time"
                  value={node.waitTime}
                  confidenceInterval={node.waitTimeCI}
                  isTime
                  tooltip={tooltips.waitTime}
                />
                <StatItem
                  label="Service Time"
                  value={node.serviceTime}
                  confidenceInterval={node.serviceTimeCI}
                  isTime
                  tooltip={tooltips.serviceTime}
                />
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Throughput
                    </Typography>
                    <Tooltip title="Measures the flow of customers through this node">
                      <InfoIcon size={14} />
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Tooltip title={tooltips.throughput.arrivals}>
                      <Typography variant="body2">
                        Arrivals: <Box component="span" sx={{ fontWeight: 'bold' }}>
                          {node.throughput?.arrivals?.toLocaleString() || '0'}
                        </Box>
                      </Typography>
                    </Tooltip>
                    <Tooltip title={tooltips.throughput.completed}>
                      <Typography variant="body2">
                        Completed: <Box component="span" sx={{ fontWeight: 'bold' }}>
                          {node.throughput?.completed?.toLocaleString() || '0'}
                        </Box>
                      </Typography>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default NodeDetailCards;