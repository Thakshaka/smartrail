import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Storage,
  CloudDownload,
  Backup,
  Delete,
  Refresh
} from '@mui/icons-material';
import { useAlert } from '../../contexts/AlertContext';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    enableNotifications: true,
    enableTracking: true,
    maxBookingsPerUser: 5,
    bookingAdvanceDays: 30,
    systemEmail: 'admin@smartrail.lk',
    supportPhone: '+94 11 234 5678'
  });
  const { showSuccess, showError } = useAlert();

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, this would make an API call
    showSuccess('Settings saved successfully');
  };

  const handleBackupDatabase = () => {
    // In a real app, this would trigger a database backup
    showSuccess('Database backup initiated');
  };

  const handleClearCache = () => {
    // In a real app, this would clear system cache
    showSuccess('System cache cleared');
  };

  const handleExportData = () => {
    // In a real app, this would export system data
    showSuccess('Data export initiated');
  };

  const systemLogs = [
    { id: 1, message: 'User john.doe@example.com logged in', timestamp: '2024-12-10 14:30:00', type: 'info' },
    { id: 2, message: 'Train #1001 status updated to active', timestamp: '2024-12-10 14:25:00', type: 'info' },
    { id: 3, message: 'Database backup completed successfully', timestamp: '2024-12-10 14:00:00', type: 'success' },
    { id: 4, message: 'Failed login attempt from IP 192.168.1.100', timestamp: '2024-12-10 13:45:00', type: 'warning' },
    { id: 5, message: 'System maintenance completed', timestamp: '2024-12-10 13:00:00', type: 'success' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                General Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    />
                  }
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowRegistrations}
                      onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                    />
                  }
                  label="Allow New Registrations"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                    />
                  }
                  label="Enable Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableTracking}
                      onChange={(e) => handleSettingChange('enableTracking', e.target.checked)}
                    />
                  }
                  label="Enable Real-time Tracking"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Booking Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Max Bookings per User"
                  type="number"
                  value={settings.maxBookingsPerUser}
                  onChange={(e) => handleSettingChange('maxBookingsPerUser', parseInt(e.target.value))}
                  size="small"
                />
                <TextField
                  label="Booking Advance Days"
                  type="number"
                  value={settings.bookingAdvanceDays}
                  onChange={(e) => handleSettingChange('bookingAdvanceDays', parseInt(e.target.value))}
                  size="small"
                />
                <TextField
                  label="System Email"
                  value={settings.systemEmail}
                  onChange={(e) => handleSettingChange('systemEmail', e.target.value)}
                  size="small"
                />
                <TextField
                  label="Support Phone"
                  value={settings.supportPhone}
                  onChange={(e) => handleSettingChange('supportPhone', e.target.value)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Backup />}
                  onClick={handleBackupDatabase}
                  fullWidth
                >
                  Backup Database
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownload />}
                  onClick={handleExportData}
                  fullWidth
                >
                  Export Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={handleClearCache}
                  fullWidth
                >
                  Clear Cache
                </Button>
                <Divider />
                <Button
                  variant="contained"
                  onClick={handleSaveSettings}
                  fullWidth
                >
                  Save All Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Logs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent System Logs
                </Typography>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>
              <List dense>
                {systemLogs.map((log) => (
                  <ListItem key={log.id}>
                    <ListItemText
                      primary={log.message}
                      secondary={log.timestamp}
                    />
                    <ListItemSecondaryAction>
                      <Alert 
                        severity={log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'info'} 
                        sx={{ py: 0, px: 1, fontSize: '0.75rem' }}
                      >
                        {log.type}
                      </Alert>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Alert severity="success">
                    <Typography variant="body2">Database: Online</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Alert severity="success">
                    <Typography variant="body2">API: Healthy</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Alert severity="success">
                    <Typography variant="body2">ML Service: Running</Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Alert severity="info">
                    <Typography variant="body2">Uptime: 99.9%</Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettings;
