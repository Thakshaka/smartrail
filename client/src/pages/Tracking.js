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
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  MyLocation
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';
import { useAlert } from '../contexts/AlertContext';
import { trainService } from '../services/trainService';
import { trackingService } from '../services/trackingService';
import { predictionService } from '../services/predictionService';

const Tracking = () => {
  const [selectedTrain, setSelectedTrain] = useState('');
  const [trains, setTrains] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState([]);

  const { joinTrainTracking, leaveTrainTracking, getTrainUpdate, isConnected } = useSocket();
  const { showError } = useAlert();

  // Load available trains
  useEffect(() => {
    (async () => {
      try {
        const response = await trainService.getAllTrains();
        const trainsList = response?.data?.trains || response?.trains || [];
        setTrains(trainsList);
      } catch (error) {
        showError('Failed to load trains');
      }
    })();
  }, [showError]);

  // Join/leave train tracking when selection changes
  useEffect(() => {
    if (selectedTrain) {
      joinTrainTracking(selectedTrain);
      loadTrackingData(selectedTrain);
      // Proactively trigger predictions, then fetch
      (async () => {
        try {
          await predictionService.triggerPredictionUpdate(selectedTrain);
        } catch (e) {
          // ignore
        } finally {
          // slight delay to allow server to compute
          setTimeout(() => loadPredictions(selectedTrain), 900);
        }
      })();
      loadTrackingHistory(selectedTrain);
    } else {
      leaveTrainTracking(selectedTrain);
    }

    return () => {
      if (selectedTrain) {
        leaveTrainTracking(selectedTrain);
      }
    };
  }, [selectedTrain, joinTrainTracking, leaveTrainTracking]);

  // Listen for real-time updates
  useEffect(() => {
    if (selectedTrain) {
      const update = getTrainUpdate(selectedTrain);
      if (update) {
        setTrackingData(update);
      }
    }
  }, [selectedTrain, getTrainUpdate]);

  // Auto-seed data if empty for selected train (dev helper)
  useEffect(() => {
    const seedIfNeeded = async () => {
      if (!selectedTrain) return;
      try {
        const response = await trackingService.getTrainTracking(selectedTrain);
        const current = response?.data?.currentLocation || response?.current_location || null;
        const history = response?.data?.trackingHistory || response?.trackingHistory || [];
        if (!current && history.length === 0) {
          // Create an initial point to unblock UI
          await trackingService.updateTrainLocation(selectedTrain, {
            latitude: 7.8731 + (Math.random() - 0.5) * 0.02,
            longitude: 80.7718 + (Math.random() - 0.5) * 0.02,
            speed: Math.floor(Math.random() * 60) + 40,
            heading: Math.floor(Math.random() * 360)
          });
          // Trigger predictions update
          await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/predictions/update/train/${selectedTrain}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
          });
          // Reload
          await loadTrackingData(selectedTrain);
          await loadPredictions(selectedTrain);
          await loadTrackingHistory(selectedTrain);
        }
      } catch (e) {
        // Ignore
      }
    };
    seedIfNeeded();
  }, [selectedTrain]);

  // loadTrains removed (inlined in effect)

  const loadTrackingData = async (trainId) => {
    try {
      const response = await trackingService.getTrainTracking(trainId);
      const current = response?.data?.currentLocation || response?.current_location || response?.currentLocation;
      setTrackingData(current || null);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  };

  const loadPredictions = async (trainId) => {
    try {
      const response = await predictionService.getTrainPredictions(trainId);
      const list = response?.data?.predictions || response?.predictions || [];
      setPredictions(list);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    }
  };

  const loadTrackingHistory = async (trainId) => {
    try {
      // Use server-supported history (hours)
      const response = await trackingService.getTrainTracking(trainId);
      const history = response?.data?.trackingHistory || response?.trackingHistory || [];
      setTrackingHistory(history);
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

  const formatPredictedTime = (value) => {
    if (!value) return 'N/A';
    // If value looks like HH:mm:ss, return as is in local-friendly format without parsing to Date
    if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
      // Show as HH:mm AM/PM
      const [hh, mm] = value.split(':');
      const hours = Number(hh);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = ((hours + 11) % 12) + 1; // 0->12, 13->1
      return `${displayHour}:${mm} ${period}`;
    }
    // Otherwise try to format as a Date
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      // If server accidentally returns "Invalid" or other string, fallback to 'TBD'
      if (typeof value === 'string' && value.toLowerCase().includes('invalid')) return 'TBD';
      return String(value);
    }
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // getStatusColor removed (unused)

  const getDirectionText = (degrees) => {
    if (degrees >= 315 || degrees < 45) return 'North';
    if (degrees >= 45 && degrees < 135) return 'East';
    if (degrees >= 135 && degrees < 225) return 'South';
    if (degrees >= 225 && degrees < 315) return 'West';
    return 'Unknown';
  };

  // Safe number utilities to avoid toFixed errors
  const toFiniteNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const formatCoord = (value, digits = 6) => {
    const n = toFiniteNumber(value);
    return n === null ? 'N/A' : n.toFixed(digits);
  };
  const formatSpeed = (value) => {
    const n = toFiniteNumber(value);
    return n === null ? 'N/A' : `${n} km/h`;
  };

  return (
    <Box>
      <Box sx={{
        mb: 4,
        p: 3,
        background: 'linear-gradient(135deg, rgba(13,71,161,0.08), rgba(38,198,218,0.08))',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Train Tracking
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track trains in real-time with ML-driven live updates and arrival predictions
        </Typography>
      </Box>

      {/* Train Selection */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
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
                    {(train.train_number || train.number)} - {(train.train_name || train.name)} ({train.train_type || train.type})
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
                          {formatCoord(trackingData.latitude)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Longitude
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCoord(trackingData.longitude)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Speed
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatSpeed(trackingData.speed_kmh ?? trackingData.speed)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Direction
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {toFiniteNumber(trackingData.direction_degrees ?? trackingData.heading) !== null ?
                            `${toFiniteNumber(trackingData.direction_degrees ?? trackingData.heading)}° (${getDirectionText(toFiniteNumber(trackingData.direction_degrees ?? trackingData.heading))})` :
                            'N/A'}
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
                          primary={prediction.station_name || prediction.station?.name}
                          secondary={`${formatPredictedTime(prediction.predicted_time || prediction.predicted_arrival_time || prediction.scheduled_time || 'TBD')} (${((prediction.confidence || prediction.confidence_score || 0) * 100).toFixed(0)}% confidence)`}
                        />
                        <Chip
                          label={`${((prediction.confidence || prediction.confidence_score || 0) * 100).toFixed(0)}%`}
                          color={(prediction.confidence || prediction.confidence_score || 0) > 0.8 ? 'success' : (prediction.confidence || prediction.confidence_score || 0) > 0.6 ? 'warning' : 'error'}
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
                            primary={`${formatCoord(point.latitude, 4)}, ${formatCoord(point.longitude, 4)}`}
                            secondary={`${formatSpeed(point.speed_kmh ?? point.speed)} • ${formatTime(point.timestamp)}`}
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
                        Coordinates: {formatCoord(trackingData.latitude, 4)}, {formatCoord(trackingData.longitude, 4)}
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