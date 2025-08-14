import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  IconButton,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Warning,
  Error,
  Info,
  Notifications
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { useAlert } from '../../contexts/AlertContext';

const AlertManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'create', // 'create', 'edit'
    alert: null
  });
  const [formData, setFormData] = useState({
    type: '',
    severity: '',
    title: '',
    message: '',
    trainId: '',
    stationId: ''
  });
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    loadAlerts();
  }, [pagination.page, typeFilter, severityFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAlerts({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter,
        severity: severityFilter
      });
      setAlerts(response.data.alerts);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Failed to load alerts:', error);
      showError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'type') {
      setTypeFilter(value);
    } else if (filterType === 'severity') {
      setSeverityFilter(value);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleOpenDialog = (mode, alert = null) => {
    setDialog({ open: true, mode, alert });
    if (mode === 'edit' && alert) {
      setFormData({
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        trainId: alert.trainId || '',
        stationId: alert.stationId || ''
      });
    } else {
      setFormData({
        type: '',
        severity: '',
        title: '',
        message: '',
        trainId: '',
        stationId: ''
      });
    }
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: 'create', alert: null });
    setFormData({
      type: '',
      severity: '',
      title: '',
      message: '',
      trainId: '',
      stationId: ''
    });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (dialog.mode === 'create') {
        await adminService.createAlert(formData);
        showSuccess('Alert created successfully');
      } else {
        await adminService.updateAlert(dialog.alert.id, formData);
        showSuccess('Alert updated successfully');
      }
      handleCloseDialog();
      loadAlerts();
    } catch (error) {
      console.error('Failed to save alert:', error);
      showError('Failed to save alert');
    }
  };

  const handleDelete = async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await adminService.deleteAlert(alertId);
        showSuccess('Alert deleted successfully');
        loadAlerts();
      } catch (error) {
        console.error('Failed to delete alert:', error);
        showError('Failed to delete alert');
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
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

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      case 'info':
        return <Info />;
      default:
        return <Notifications />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'delay':
        return 'warning';
      case 'cancellation':
        return 'error';
      case 'platform_change':
        return 'info';
      case 'service_update':
        return 'primary';
      case 'weather':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Alert Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog('create')}
        >
          Create Alert
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={typeFilter}
              label="Filter by Type"
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="delay">Delay</MenuItem>
              <MenuItem value="cancellation">Cancellation</MenuItem>
              <MenuItem value="platform_change">Platform Change</MenuItem>
              <MenuItem value="service_update">Service Update</MenuItem>
              <MenuItem value="weather">Weather</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Severity</InputLabel>
            <Select
              value={severityFilter}
              label="Filter by Severity"
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <MenuItem value="">All Severities</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  No alerts found
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {alert.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.type.replace('_', ' ')}
                      color={getTypeColor(alert.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getSeverityIcon(alert.severity)}
                      label={alert.severity}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {alert.message.length > 100 
                        ? `${alert.message.substring(0, 100)}...` 
                        : alert.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatDate(alert.timestamp)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', alert)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialog.mode === 'create' ? 'Create New Alert' : 'Edit Alert'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <MenuItem value="delay">Delay</MenuItem>
                  <MenuItem value="cancellation">Cancellation</MenuItem>
                  <MenuItem value="platform_change">Platform Change</MenuItem>
                  <MenuItem value="service_update">Service Update</MenuItem>
                  <MenuItem value="weather">Weather</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  label="Severity"
                  onChange={(e) => handleFormChange('severity', e.target.value)}
                >
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message"
                value={formData.message}
                onChange={(e) => handleFormChange('message', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Train ID (Optional)"
                type="number"
                value={formData.trainId}
                onChange={(e) => handleFormChange('trainId', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Station ID (Optional)"
                type="number"
                value={formData.stationId}
                onChange={(e) => handleFormChange('stationId', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertManagement;
