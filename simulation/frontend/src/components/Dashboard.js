import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import { PlayArrow, ArrowBack } from '@mui/icons-material';

const formatTime = (minutes) => {
  if (!minutes && minutes !== 0) return 'N/A';
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} sec`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
};

const MetricCard = ({ title, value, subtitle, isTime = false }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" sx={{ mb: 1 }}>
      {isTime ? formatTime(value) : typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value || 'N/A'}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="textSecondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ pt: 2 }}>
        {children}
      </Box>
    )}
  </div>
);

const Dashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState({ project: true, simulation: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

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
        setLoading({ project: false, simulation: false });
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message);
        setLoading({ project: false, simulation: false });
      }
    };

    fetchProjectData();
  }, [projectId]);

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
      
      const projectRes = await fetch(`/api/projects/${projectId}/`);
      setProject(await projectRes.json());
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message);
    } finally {
      setLoading({ ...loading, simulation: false });
    }
  };

  const renderSystemMetrics = () => {
    if (!simulationResults?.analysis?.system_stats) return null;
    const stats = simulationResults.analysis.system_stats;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Customers"
            value={stats.total_customers}
            subtitle="Processed in simulation"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Avg Service Time"
            value={stats.overall_service_time?.mean}
            subtitle={`90th percentile: ${stats.overall_service_time?.percentile_90?.toFixed(2) || 'N/A'}`}
            isTime={true}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Avg Waiting Time"
            value={stats.overall_waiting_time?.mean}
            subtitle={`90th percentile: ${stats.overall_waiting_time?.percentile_90?.toFixed(2) || 'N/A'}`}
            isTime={true}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Avg Flow Time"
            value={stats.overall_flow_time?.mean}
            subtitle={`90th percentile: ${stats.overall_flow_time?.percentile_90?.toFixed(2) || 'N/A'}`}
            isTime={true}
          />
        </Grid>
      </Grid>
    );
  };

  const renderNodeTable = () => {
    if (!simulationResults?.analysis?.node_statistics) return null;

    return (
      <Box sx={{ 
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Node</TableCell>
              <TableCell align="right">Utilization</TableCell>
              <TableCell align="right">Completed</TableCell>
              <TableCell align="right">Avg Queue</TableCell>
              <TableCell align="right">Avg Wait</TableCell>
              <TableCell align="right">Avg Service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(simulationResults.analysis.node_statistics).map(([nodeId, stats]) => (
              <TableRow key={nodeId}>
                <TableCell>Node {nodeId}</TableCell>
                <TableCell align="right">
                  {(simulationResults.utilization[nodeId - 1]?.utilization_rate * 100 || 0).toFixed(1)}%
                </TableCell>
                <TableCell align="right">
                  {stats.throughput.completed.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {simulationResults.utilization[nodeId - 1]?.avg_queue_length.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {formatTime(stats.waiting_time.mean)}
                </TableCell>
                <TableCell align="right">
                  {formatTime(stats.service_time.mean)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const renderDetailedMetrics = () => {
    if (!simulationResults?.analysis?.node_statistics) return null;

    return (
      <Grid container spacing={2}>
        {Object.entries(simulationResults.analysis.node_statistics).map(([nodeId, stats]) => (
          <Grid item xs={12} md={6} lg={4} key={nodeId}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Node {nodeId}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Completion Rate</Typography>
                  <Typography variant="body1">
                    {(stats.throughput.completion_rate * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">95th Percentile Wait</Typography>
                  <Typography variant="body1">
                    {formatTime(stats.waiting_time.percentile_95)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Max Queue Time</Typography>
                  <Typography variant="body1">
                    {formatTime(stats.waiting_time.max)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Servers</Typography>
                  <Typography variant="body1">
                    {simulationResults.utilization[nodeId - 1]?.total_servers || 1}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Simulation Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                startIcon={loading.simulation ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={runSimulation}
                disabled={loading.simulation}
              >
                {loading.simulation ? 'Running...' : 'Run Simulation'}
              </Button>
              
              <Typography variant="body2" color="textSecondary">
                Last run: {project?.updated_at ? new Date(project.updated_at).toLocaleString() : 'Never'}
              </Typography>
            </Box>
          </Paper>

          {simulationResults && (
            <>
              {renderSystemMetrics()}

              <Box sx={{ mt: 4 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="Node Performance" id="tab-0" />
                  <Tab label="Detailed Metrics" id="tab-1" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                  {renderNodeTable()}
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                  {renderDetailedMetrics()}
                </TabPanel>
              </Box>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;