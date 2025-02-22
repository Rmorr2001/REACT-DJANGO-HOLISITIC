import React from 'react';
import { useParams } from 'react-router-dom';
import { useAIAssistant } from './AIAssistantContext.js';
import { Box, Typography, Button, Alert } from '@mui/material';
import { AutoFixHigh as AIIcon } from '@mui/icons-material';

/**
 * Component for displaying simulation results with AI analysis option
 */
const SimulationAnalysis = ({ results }) => {
  const { openAssistant } = useAIAssistant();
  const { projectId } = useParams();
  
  if (!results || Object.keys(results).length === 0) {
    return (
      <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Alert severity="info">
          No simulation results are available yet. Run a simulation to see results.
        </Alert>
        <Button 
          startIcon={<AIIcon />}
          variant="outlined" 
          onClick={openAssistant}
          sx={{ mt: 2 }}
        >
          Ask AI Assistant to help run a simulation
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">
          Simulation Results
        </Typography>
        <Button 
          startIcon={<AIIcon />}
          variant="outlined" 
          onClick={openAssistant}
        >
          Analyze with AI
        </Button>
      </Box>
      
      {/* You can add a basic results display here */}
      {results.system_metrics && (
        <Box sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            System Metrics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Typography>
              Utilization: {(results.system_metrics.system_utilization * 100).toFixed(2)}%
            </Typography>
            <Typography>
              Throughput: {results.system_metrics.system_throughput.toFixed(2)}
            </Typography>
            <Typography>
              Avg Queue Length: {results.system_metrics.avg_system_queue.toFixed(2)}
            </Typography>
            <Typography>
              Avg Wait Time: {results.system_metrics.avg_system_wait.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}
      
      {results.node_metrics && Array.isArray(results.node_metrics) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Node Metrics
          </Typography>
          {results.node_metrics.map((node, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 2, 
                p: 2, 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1 
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Node {index}: {node.name || `Node ${index}`}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                <Typography>
                  Utilization: {(node.utilization * 100).toFixed(2)}%
                </Typography>
                <Typography>
                  Throughput: {node.throughput.toFixed(2)}
                </Typography>
                <Typography>
                  Avg Queue Length: {node.avg_queue_length.toFixed(2)}
                </Typography>
                <Typography>
                  Avg Wait Time: {node.avg_wait_time.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          startIcon={<AIIcon />}
          variant="contained" 
          onClick={openAssistant}
          color="primary"
        >
          Get AI Recommendations
        </Button>
      </Box>
    </Box>
  );
};

export default SimulationAnalysis;