import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  PlayArrow,
  ArrowBack,
  AutoFixHigh as AIIcon
} from '@mui/icons-material';
import { useAIAssistant } from '../Gemini/AIAssistantContext.js';

// Import dashboard components
import SystemOverviewMetrics from './SystemOverviewMetrics.js';
import NodeCharts from './NodeCharts.js';
import NodeDetailCards from './NodeDetailCards.js';
import TabPanel from './TabPanel.js';

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { openAssistant } = useAIAssistant();
  const [project, setProject] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState({ project: true, simulation: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState({ nodes: [], system: {} });

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectResponse = await fetch(`/api/projects/${projectId}/`);
        if (!projectResponse.ok) throw new Error('Failed to load project');
        
        const resultsResponse = await fetch(`/api/projects/${projectId}/results/`);
        
        const projectData = await projectResponse.json();
        const resultsData = resultsResponse.ok ? await resultsResponse.json() : null;
        
        setProject(projectData);
        setSimulationResults(resultsData);
        processChartData(resultsData);
        setLoading({ project: false, simulation: false });
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message);
        setLoading({ project: false, simulation: false });
      }
    };

    fetchProjectData();
  }, [projectId]);

  const processChartData = (results) => {
    if (!results || !results.analysis) return;
    
    // Process node data for charts
    const nodeData = [];
    
    // Process utilization data for bar charts
    const utilizationData = [];
    const waitTimeData = [];
    const serviceTimeData = [];
    const throughputData = [];
    
    // Extract node statistics
    if (results.analysis.node_statistics) {
      Object.entries(results.analysis.node_statistics).forEach(([nodeId, stats], index) => {
        const nodeIndex = parseInt(nodeId) - 1;
        const utilization = results.utilization[nodeIndex]?.utilization_rate || 0;
        const waitTime = stats.waiting_time?.mean || 0;
        const serviceTime = stats.service_time?.mean || 0;
        
        // For utilization chart
        utilizationData.push({
          name: `Node ${nodeId}`,
          utilization: utilization * 100
        });
        
        // For wait time chart
        waitTimeData.push({
          name: `Node ${nodeId}`,
          waitTime: waitTime
        });
        
        // For service time chart
        serviceTimeData.push({
          name: `Node ${nodeId}`,
          serviceTime: serviceTime
        });
        
        // For throughput chart
        throughputData.push({
          name: `Node ${nodeId}`,
          arrivals: stats.throughput.arrivals,
          completed: stats.throughput.completed
        });
        
        // Combined data for node details
        nodeData.push({
          id: nodeId,
          utilization: utilization,
          avgQueue: results.utilization[nodeIndex]?.avg_queue_length || 0,
          waitTime: waitTime,
          serviceTime: serviceTime,
          throughput: stats.throughput,
          servers: results.utilization[nodeIndex]?.total_servers || 1
        });
      });
    }
    
    // Set all chart data
    setChartData({
      nodes: nodeData,
      utilization: utilizationData,
      waitTime: waitTimeData,
      serviceTime: serviceTimeData,
      throughput: throughputData,
      system: results.analysis.system_stats || {}
    });
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
      processChartData(data.results);
      
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

  const handleAnalyzeWithAI = () => {
    openAssistant();
    // Pass a hint to the assistant to run the analyze_simulation action
    window.dispatchEvent(new CustomEvent('ai-analyze-request', { 
      detail: { 
        projectId: projectId
      }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Simulation Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AIIcon />}
            onClick={handleAskAI}
          >
            AI Assistant
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading.project ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
              
              <Button 
                variant="outlined"
                startIcon={<AIIcon />}
                onClick={handleAnalyzeWithAI}
              >
                Analyze Results
              </Button>
            </Box>
          </Paper>

          {simulationResults ? (
            <>
              <SystemOverviewMetrics stats={simulationResults?.analysis?.system_stats} />

              <Box sx={{ mt: 4 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Node Charts" id="tab-0" />
                  <Tab label="Node Details" id="tab-1" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                  <NodeCharts chartData={chartData} />
                </TabPanel>
                
                <TabPanel value={activeTab} index={1}>
                  <NodeDetailCards nodes={chartData.nodes} />
                </TabPanel>
              </Box>
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
        </>
      )}
    </Container>
  );
};

export default Dashboard;