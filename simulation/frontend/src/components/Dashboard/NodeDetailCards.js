import React from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box, Divider } from '@mui/material';

// Helper functions
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

const NodeDetailCards = ({ nodes }) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <Grid container spacing={2}>
      {nodes.map((node) => (
        <Grid item xs={12} md={6} lg={4} key={node.id}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardHeader 
              title={`Node ${node.id}`} 
              subheader={`${node.servers} server${node.servers > 1 ? 's' : ''}`}
              titleTypographyProps={{ variant: 'h6' }}
              sx={{ pb: 1 }}
            />
            <Divider />
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Utilization</Typography>
                  <Typography variant="body1" color="primary">
                    {formatPercent(node.utilization)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Avg Queue</Typography>
                  <Typography variant="body1">
                    {node.avgQueue.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Wait Time</Typography>
                  <Typography variant="body1" color="warning.main">
                    {formatTime(node.waitTime)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Service Time</Typography>
                  <Typography variant="body1" color="success.main">
                    {formatTime(node.serviceTime)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="textSecondary">Throughput</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2">
                      Arrivals: <strong>{node.throughput.arrivals}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Completed: <strong>{node.throughput.completed}</strong>
                    </Typography>
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