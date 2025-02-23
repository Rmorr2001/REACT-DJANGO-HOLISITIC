import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Slider
} from '@mui/material';
import {
  PlayArrow,
  ArrowBack,
  AutoFixHigh as AIIcon
} from '@mui/icons-material';
import { useAIAssistant } from '../Gemini/AIAssistantContext.js';

// Import your existing components
import SystemOverviewMetrics from './SystemOverviewMetrics.js';
import NodeCharts from './NodeCharts.js';
import NodeDetailCards from './NodeDetailCards.js';
import TabPanel from './TabPanel.js';

// Import the data processor utility
import { processSimulationData, filterSimulationData } from './simulationDataProcessor.js';

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { openAssistant } = useAIAssistant();
  const [project, setProject] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState({ project: true, simulation: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState('all');
  const [completionRange, setCompletionRange] = useState([0, 100]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    if (simulationResults) {
      const filtered = filterSimulationData(
        simulationResults, 
        selectedNode, 
        completionRange
      );
      setProcessedData(filtered);
    }
  }, [simulationResults, selectedNode, completionRange]);

  const fetchProjectData = async () => {
    try {
      const projectResponse = await fetch(`/api/projects/${projectId}/`);
      if (!projectResponse.ok) throw new Error('Failed to load project');
      
      const resultsResponse = await fetch(`/api/projects/${projectId}/results/`);
      
      const projectData = await projectResponse.json();
      const resultsData = resultsResponse.ok ? await resultsResponse.json() : null;
      
      setProject(projectData);
      setSimulationResults(resultsData);
      if (resultsData) {
        setProcessedData(processSimulationData(resultsData));
      }
      setLoading({ project: false, simulation: false });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
      setLoading({ project: false, simulation: false });
    }
  };

  const runSimulation = async () => {
    setLoading({ ...loading, simulation: true });
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/simulate/`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Simulation failed');
      
      const data = await response.json();
      setSimulationResults(data.results);
      setProcessedData(processSimulationData(data.results));
      
      const projectRes = await fetch(`/api/projects/${projectId}/`);
      setProject(await projectRes.json());
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message);
    } finally {
      setLoading({ ...loading, simulation: false });
    }
  };

  const handleAskAI = () => {
    openAssistant();
  };

  if (loading.project && !processedData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {project?.name || 'Simulation Dashboard'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Control Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading.simulation ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            onClick={runSimulation}
            disabled={loading.simulation}
            sx={{ minWidth: 150 }}
          >
            {loading.simulation ? 'Running...' : 'Run Simulation'}
          </Button>
          
          <Typography variant="body2" color="textSecondary">
            Last run: {project?.updated_at ? new Date(project.updated_at).toLocaleString() : 'Never'}
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
        </Box>
      </Paper>

      {processedData ? (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Node</InputLabel>
                <Select
                  value={selectedNode}
                  onChange={(e) => setSelectedNode(e.target.value)}
                  label="Node"
                >
                  <MenuItem value="all">All Nodes</MenuItem>
                  {processedData.nodes.map((node) => (
                    <MenuItem key={node.id} value={node.id}>
                      {node.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ width: 300, mx: 4 }}>
                <Typography gutterBottom>Completion Range (%)</Typography>
                <Slider
                  value={completionRange}
                  onChange={(e, newValue) => setCompletionRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                />
              </Box>
            </Box>
          </Paper>

          {/* System Overview Metrics */}
          <SystemOverviewMetrics stats={processedData.system} />

          {/* Tabs Section */}
          <Paper sx={{ mt: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Node Charts" />
              <Tab label="Node Details" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <NodeCharts chartData={processedData} />
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <NodeDetailCards nodes={processedData.nodes} />
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No simulation results available
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Click "Run Simulation" to generate results, or ask the AI Assistant for help.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={handleAskAI}
          >
            Ask AI to help run a simulation
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;