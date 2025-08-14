import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Dashboard,
  People,
  Train,
  BookOnline,
  Analytics,
  Settings,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminService } from '../services/adminService';
import AdminStats from '../components/admin/AdminStats';
import UserManagement from '../components/admin/UserManagement';
import TrainManagement from '../components/admin/TrainManagement';
import BookingManagement from '../components/admin/BookingManagement';
import AlertManagement from '../components/admin/AlertManagement';
import SystemSettings from '../components/admin/SystemSettings';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    aria-labelledby={`admin-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const { user } = useAuth();
  const { showError } = useAlert();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, trains, bookings, and system settings
        </Typography>
      </Box>

      {/* Quick Stats */}
      {dashboardStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div" color="primary">
                  {dashboardStats.stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Train color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div" color="secondary">
                  {dashboardStats.stats.totalTrains}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Trains
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <BookOnline color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div" color="success.main">
                  {dashboardStats.stats.totalBookings}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Analytics color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" component="div" color="warning.main">
                  Rs. {dashboardStats.stats.totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
            <Tab icon={<Dashboard />} label="Overview" />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<Train />} label="Trains" />
            <Tab icon={<BookOnline />} label="Bookings" />
            <Tab icon={<Notifications />} label="Alerts" />
            <Tab icon={<Settings />} label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AdminStats stats={dashboardStats} onRefresh={loadDashboardStats} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TrainManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <BookingManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AlertManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <SystemSettings />
        </TabPanel>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
