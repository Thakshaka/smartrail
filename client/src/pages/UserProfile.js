import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Edit,
  Save,
  Cancel,
  Security,
  History,
  BookOnline,
  Notifications,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import axios from 'axios';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const UserProfile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    preferences: {
      notifications: true,
      email_alerts: true,
      sms_alerts: false
    }
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { user, updateProfile, changePassword } = useAuth();
  const { showError, showSuccess } = useAlert();

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        preferences: {
          notifications: user.preferences?.notifications ?? true,
          email_alerts: user.preferences?.email_alerts ?? true,
          sms_alerts: user.preferences?.sms_alerts ?? false
        }
      });
    }
    loadUserBookings();
  }, [user]);

  const loadUserBookings = async () => {
    try {
      const response = await axios.get('/api/bookings');
      setUserBookings(response.data.bookings);
    } catch (error) {
      console.error('Failed to load user bookings:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel editing - reset to original data
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        preferences: {
          notifications: user.preferences?.notifications ?? true,
          email_alerts: user.preferences?.email_alerts ?? true,
          sms_alerts: user.preferences?.sms_alerts ?? false
        }
      });
    }
    setEditMode(!editMode);
  };

  const handleProfileChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess('Profile updated successfully');
        setEditMode(false);
      } else {
        showError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const result = await changePassword(passwordData.current_password, passwordData.new_password);
      if (result.success) {
        showSuccess('Password changed successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        showError(result.error || 'Failed to change password');
      }
    } catch (error) {
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account settings and preferences
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {user.first_name} {user.last_name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              
              <Chip 
                label="Active Member" 
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Member since {formatDate(user.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Profile" icon={<Person />} />
                  <Tab label="Bookings" icon={<History />} />
                  <Tab label="Security" icon={<Security />} />
                  <Tab label="Preferences" icon={<Settings />} />
                </Tabs>
              </Box>

              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Personal Information</Typography>
                  <Button
                    variant={editMode ? "outlined" : "contained"}
                    startIcon={editMode ? <Cancel /> : <Edit />}
                    onClick={handleEditToggle}
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.first_name}
                      onChange={(e) => handleProfileChange('first_name', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.last_name}
                      onChange={(e) => handleProfileChange('last_name', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={3}
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>

                {editMode && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveProfile}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </TabPanel>

              {/* Bookings Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  My Bookings
                </Typography>
                
                {userBookings.length === 0 ? (
                  <Alert severity="info">
                    No bookings found. Start by searching for trains and making a booking.
                  </Alert>
                ) : (
                  <List>
                    {userBookings.map((booking) => (
                      <ListItem key={booking.id} divider>
                        <ListItemIcon>
                          <BookOnline color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${booking.train_name} - ${booking.from_station} to ${booking.to_station}`}
                          secondary={`${formatDate(booking.journey_date)} • ${booking.passengers.length} passenger(s)`}
                        />
                        <Chip
                          label={booking.status}
                          color={getBookingStatusColor(booking.status)}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                  >
                    Change Password
                  </Button>
                </Box>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive real-time updates about your bookings"
                    />
                    <Chip
                      label={profileData.preferences.notifications ? "Enabled" : "Disabled"}
                      color={profileData.preferences.notifications ? "success" : "default"}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Alerts"
                      secondary="Get important updates via email"
                    />
                    <Chip
                      label={profileData.preferences.email_alerts ? "Enabled" : "Disabled"}
                      color={profileData.preferences.email_alerts ? "success" : "default"}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="SMS Alerts"
                      secondary="Receive urgent notifications via SMS"
                    />
                    <Chip
                      label={profileData.preferences.sms_alerts ? "Enabled" : "Disabled"}
                      color={profileData.preferences.sms_alerts ? "success" : "default"}
                      size="small"
                    />
                  </ListItem>
                </List>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile; 