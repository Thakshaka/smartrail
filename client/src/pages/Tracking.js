import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Train,
  LocationOn,
  Speed,
  Schedule,
  ExpandMore,
  MyLocation,
  Directions,
  Timeline
} from '@mui/icons-material';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAlert } from '../contexts/AlertContext';

const Tracking = () => {
  const [selectedTrain, setSelectedTrain] = useState('');
  const [trains, setTrains] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState([]);

  const { joinTrainTracking, leaveTrainTracking, getTrainUpdate, isConnected } = useSocket();
  const { showError } = useAlert();

  // Load available trains
  useEffect(() => {
    loadTrains();
  }, []);

  // Join/leave train tracking when selection changes
  useEffect(() => {
    if (selectedTrain) {
      joinTrainTracking(selectedTrain);
      loadTrackingData(selectedTrain);
      loadPredictions(selectedTrain);
      loadTrackingHistory(selectedTrain);
    } else {
      leaveTrainTracking(selectedTrain);
    }

    return () => {
      if (selectedTrain) {
        leaveTrainTracking(selectedTrain);
      }
    };
  }, [selectedTrain]);

  // Listen for real-time updates
  useEffect(() => {
    if (selectedTrain) {
      const update = getTrainUpdate(selectedTrain);
      if (update) {
        setTrackingData(update);
      }
    }
  }, [selectedTrain, getTrainUpdate]);

  const loadTrains = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trains');
      setTrains(response.data.trains);
    } catch (error) {
      showError('Failed to load trains');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackingData = async (trainId) => {
    try {
      const response = await axios.get(`/api/tracking/${trainId}`);
      setTrackingData(response.data.current_location);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  };

  const loadPredictions = async (trainId) => {
    try {
      const response = await axios.get(`/api/predictions/${trainId}`);
      setPredictions(response.data.predictions);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    }
  };

  const loadTrackingHistory = async (trainId) => {
    try {
      const response = await axios.get(`/api/tracking/${trainId}?hours=6`);
      setTrackingHistory(response.data.tracking_data);
    } catch (error) {
      console.error('Failed to load tracking history:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'delayed':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDirectionText = (degrees) => {
    if (degrees >= 315 || degrees < 45) return 'North';
    if (degrees >= 45 && degrees < 135) return 'East';
    if (degrees >= 135 && degrees < 225) return 'South';
    if (degrees >= 225 && degrees < 315) return 'West';
    return 'Unknown';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Train Tracking
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track trains in real-time with live location updates and arrival predictions
      </Typography>

      {/* Train Selection */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Train</InputLabel>
              <Select
                value={selectedTrain}
                label="Select Train"
                onChange={(e) => setSelectedTrain(e.target.value)}
              >
                {trains.map((train) => (
                  <MenuItem key={train.id} value={train.id}>
                    {train.train_number} - {train.name} ({train.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<MyLocation />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                size="small"
              />
              {selectedTrain && (
                <Chip
                  label="Live Tracking Active"
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {selectedTrain ? (
        <Grid container spacing={4}>
          {/* Current Location */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Current Location
                </Typography>
                
                {trackingData ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Latitude
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {trackingData.latitude?.toFixed(6)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Longitude
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {trackingData.longitude?.toFixed(6)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Speed
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {trackingData.speed_kmh ? `${trackingData.speed_kmh} km/h` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Direction
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {trackingData.direction_degrees ? 
                            `${trackingData.direction_degrees}° (${getDirectionText(trackingData.direction_degrees)})` : 
                            'N/A'
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: {trackingData.timestamp ? formatTime(trackingData.timestamp) : 'N/A'}
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No tracking data available for this train.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Arrival Predictions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Arrival Predictions
                </Typography>
                
                {predictions.length > 0 ? (
                  <List dense>
                    {predictions.map((prediction, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Schedule color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={prediction.station_name}
                          secondary={`${new Date(prediction.predicted_arrival_time).toLocaleTimeString()} (${(prediction.confidence_score * 100).toFixed(0)}% confidence)`}
                        />
                        <Chip
                          label={`${(prediction.confidence_score * 100).toFixed(0)}%`}
                          color={prediction.confidence_score > 0.8 ? 'success' : prediction.confidence_score > 0.6 ? 'warning' : 'error'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No arrival predictions available.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Tracking History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Tracking History (Last 6 Hours)
                </Typography>
                
                {trackingHistory.length > 0 ? (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <List dense>
                      {trackingHistory.slice(0, 10).map((point, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <LocationOn color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${point.latitude?.toFixed(4)}, ${point.longitude?.toFixed(4)}`}
                            secondary={`${point.speed_kmh ? `${point.speed_kmh} km/h` : 'Speed N/A'} • ${formatTime(point.timestamp)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No tracking history available.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Map Placeholder */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Live Map View
                </Typography>
                <Box
                  sx={{
                    height: 400,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <LocationOn sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Map integration would show real-time train location here
                    </Typography>
                    {trackingData && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Coordinates: {trackingData.latitude?.toFixed(4)}, {trackingData.longitude?.toFixed(4)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          Please select a train to start tracking.
        </Alert>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Real-time connection is not available. Some features may be limited.
        </Alert>
      )}
    </Box>
  );
};

export default Tracking; 