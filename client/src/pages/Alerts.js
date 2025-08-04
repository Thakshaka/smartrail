import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Notifications,
  Warning,
  Error,
  Info,
  ExpandMore,
  Clear,
  FilterList,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAlert } from '../contexts/AlertContext';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all'
  });

  const { alerts: socketAlerts, clearAlerts, removeAlert } = useSocket();
  const { showError, showSuccess } = useAlert();

  // Load alerts on component mount
  useEffect(() => {
    loadAlerts();
  }, []);

  // Update filtered alerts when alerts or filters change
  useEffect(() => {
    let filtered = [...alerts];

    if (filters.type !== 'all') {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    setFilteredAlerts(filtered);
  }, [alerts, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/alerts');
      setAlerts(response.data.alerts);
    } catch (error) {
      showError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearAll = () => {
    clearAlerts();
    setAlerts([]);
    showSuccess('All alerts cleared');
  };

  const handleRemoveAlert = (alertId) => {
    removeAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    showSuccess('Alert removed');
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'delay':
        return 'warning';
      case 'cancellation':
        return 'error';
      case 'maintenance':
        return 'info';
      case 'weather':
        return 'secondary';
      case 'general':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Platform Alerts
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Stay informed about delays, cancellations, and important updates
      </Typography>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={filters.type}
                label="Alert Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="delay">Delays</MenuItem>
                <MenuItem value="cancellation">Cancellations</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="weather">Weather</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filters.severity}
                label="Severity"
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadAlerts}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Clear />}
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Alerts Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" color="primary">
                {alerts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" color="error">
                {alerts.filter(a => a.severity === 'critical' || a.severity === 'error').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical/Error
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" color="warning.main">
                {alerts.filter(a => a.severity === 'warning').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" color="info.main">
                {alerts.filter(a => a.severity === 'info').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Information
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredAlerts.length === 0 ? (
        <Alert severity="info">
          No alerts found matching the current filters.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAlerts.map((alert) => (
            <Grid item xs={12} key={alert.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getSeverityIcon(alert.severity)}
                      <Box>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {alert.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip
                            label={alert.type}
                            color={getTypeColor(alert.type)}
                            size="small"
                          />
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity)}
                            size="small"
                          />
                          {alert.train_name && (
                            <Chip
                              label={alert.train_name}
                              variant="outlined"
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Tooltip title="Remove Alert">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAlert(alert.id)}
                      >
                        <Clear />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {alert.message}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(alert.created_at)}
                    </Typography>
                    {alert.expires_at && (
                      <Typography variant="caption" color="text.secondary">
                        Expires: {formatTime(alert.expires_at)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Real-time Alerts */}
      {socketAlerts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Real-time Alerts
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            These are live alerts received via WebSocket connection.
          </Alert>
          <List>
            {socketAlerts.map((alert, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={alert.title}
                  secondary={alert.message}
                />
                <Chip
                  label={alert.type}
                  color={getTypeColor(alert.type)}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default Alerts; 