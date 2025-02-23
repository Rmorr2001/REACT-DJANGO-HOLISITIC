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
  Slider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon, 
  Info as InfoIcon
} from '@mui/icons-material';

// Import components (using default imports)
import SystemOverviewMetrics from './SystemOverviewMetrics.js';
import NodeCharts from './NodeCharts.js';
import NodeDetailCards from './NodeDetailCards.js';
import TabPanel from './TabPanel.js';

// Import data processor (import only once)
import { processSimulationData, filterSimulationData } from './simulationDataProcessor.js';

// TimeWindowSelector component defined within the same file
const TimeWindowSelector = ({ completionRange, setCompletionRange }) => {
  // 24 hours in minutes
  const SIMULATION_LENGTH = 1440;
  
  // Convert percentage to actual minutes
  const getTimeFromPercentage = (percent) => {
    return (percent / 100) * SIMULATION_LENGTH;
  };

  // Format time for display
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  // Format the time window for display
  const getTimeWindowText = () => {
    const startTime = getTimeFromPercentage(completionRange[0]);
    const endTime = getTimeFromPercentage(completionRange[1]);
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  return (
    <Box sx={{ width: 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography>Simulation Window</Typography>
        <Tooltip title="Select a portion of the 24-hour simulation period to analyze. This helps focus on specific time windows, such as peak hours or specific shifts.">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Slider
        value={completionRange}
        onChange={(e, newValue) => setCompletionRange(newValue)}
        valueLabelDisplay="auto"
        min={0}
        max={100}
        valueLabelFormat={value => `${formatTime(getTimeFromPercentage(value))}`}
      />
      <Typography variant="caption" color="textSecondary">
        Showing data from {getTimeWindowText()} of the 24-hour simulation
      </Typography>
    </Box>
  );
};

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [project, setProject] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState({ project: true, simulation: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter states
  const [selectedRun, setSelectedRun] = useState('all');
  const [selectedNode, setSelectedNode] = useState('all');
  const [completionRange, setCompletionRange] = useState([0, 100]);

  // Fetch initial project data
  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Process and filter data when filters or results change
  useEffect(() => {
    if (simulationResults) {
      try {
        if (!simulationResults.runs) {
          console.warn('No runs found in simulation results');
          setProcessedData(null);
          return;
        }

        const filtered = filterSimulationData(
          simulationResults,
          selectedNode,
          completionRange,
          selectedRun
        );
        
        if (filtered && filtered.nodes) {
          setProcessedData(filtered);
        } else {
          console.warn('Invalid filtered data structure');
          setProcessedData(null);
        }
      } catch (err) {
        console.error('Error processing data:', err);
        setError('Error processing simulation results');
        setProcessedData(null);
      }
    }
  }, [simulationResults, selectedNode, completionRange, selectedRun]);

  const fetchProjectData = async () => {
    try {
      setLoading({ project: true, simulation: false });
      setError(null);

      const projectResponse = await fetch(`/api/projects/${projectId}/`);
      if (!projectResponse.ok) throw new Error('Failed to load project');
      
      const resultsResponse = await fetch(`/api/projects/${projectId}/results/`);
      
      const projectData = await projectResponse.json();
      const resultsData = resultsResponse.ok ? await resultsResponse.json() : null;
      
      setProject(projectData);
      
      if (resultsData && resultsData.runs) {
        setSimulationResults(resultsData);
        try {
          const filtered = filterSimulationData(resultsData, 'all', [0, 100], 'all');
          setProcessedData(filtered);
        } catch (err) {
          console.error('Error filtering initial data:', err);
          setProcessedData(null);
        }
      } else {
        setSimulationResults(null);
        setProcessedData(null);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
      setProcessedData(null);
    } finally {
      setLoading({ project: false, simulation: false });
    }
  };

  const runSimulation = async () => {
    try {
      setLoading(prev => ({ ...prev, simulation: true }));
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/simulate/`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Simulation failed');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.runs) {
        setSimulationResults(data.results);
        try {
          const filtered = filterSimulationData(
            data.results, 
            selectedNode, 
            completionRange, 
            selectedRun
          );
          setProcessedData(filtered);
        } catch (err) {
          console.error('Error filtering simulation results:', err);
          setProcessedData(null);
        }
      } else {
        throw new Error('Invalid simulation results structure');
      }
      
      // Refresh project data to get updated timestamp
      const projectRes = await fetch(`/api/projects/${projectId}/`);
      if (projectRes.ok) {
        setProject(await projectRes.json());
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message || 'Failed to run simulation');
      setProcessedData(null);
    } finally {
      setLoading(prev => ({ ...prev, simulation: false }));
    }
  };

  // Get available runs for the select dropdown
  const availableRuns = React.useMemo(() => {
    return simulationResults?.runs?.map(run => ({
      number: run.metadata?.run_number,
      seed: run.metadata?.seed
    })) || [];
  }, [simulationResults]);

  // Loading state
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
            startIcon={<ArrowBackIcon />}
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
            startIcon={loading.simulation ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            onClick={runSimulation}
            disabled={loading.simulation}
            sx={{ minWidth: 150 }}
          >
            {loading.simulation ? 'Running...' : 'Run Simulation'}
          </Button>
          
          <Tooltip title="Runs multiple simulations with different random seeds to ensure statistical validity">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" color="textSecondary">
            Last run: {project?.updated_at ? new Date(project.updated_at).toLocaleString() : 'Never'}
          </Typography>
        </Box>
      </Paper>

      {processedData ? (
        <>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Run Selection */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Simulation Run</InputLabel>
                <Select
                  value={selectedRun}
                  onChange={(e) => setSelectedRun(e.target.value)}
                  label="Simulation Run"
                >
                  <MenuItem value="all">All Runs (Average)</MenuItem>
                  {availableRuns.map((run) => (
                    <MenuItem key={run.number} value={run.number}>
                      Run {run.number} (Seed {run.seed})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Node Selection */}
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Node</InputLabel>
                <Select
                  value={selectedNode}
                  onChange={(e) => setSelectedNode(e.target.value)}
                  label="Node"
                >
                  <MenuItem value="all">All Nodes</MenuItem>
                  {processedData.nodes?.map((node) => (
                    <MenuItem key={node.id} value={node.id}>
                      {node.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Time Window Selector */}
              <TimeWindowSelector
                completionRange={completionRange}
                setCompletionRange={setCompletionRange}
              />
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
              <NodeDetailCards nodes={processedData.nodes || []} />
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No simulation results available
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Click "Run Simulation" to generate results.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={runSimulation}
          >
            Run Simulation
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;