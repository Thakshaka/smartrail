import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import {
  Train,
  Person,
  Schedule,
  LocationOn,
  Payment,
  Receipt,
  Cancel,
  Print,
  Download,
  Share,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';
import axios from 'axios';

const BookingView = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${id}`);
      setBooking(response.data.booking);
    } catch (error) {
      showError('Failed to load booking details');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    
    try {
      await axios.post(`/api/bookings/${id}/cancel`);
      showSuccess('Booking cancelled successfully');
      setShowCancelDialog(false);
      loadBooking(); // Reload booking to get updated status
    } catch (error) {
      showError('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintTicket = () => {
    // Simulate printing functionality
    showSuccess('Printing ticket...');
  };

  const handleDownloadTicket = () => {
    // Simulate download functionality
    showSuccess('Downloading ticket...');
  };

  const handleShareBooking = () => {
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: 'My Train Booking',
        text: `I'm traveling from ${booking?.from_station} to ${booking?.to_station} on ${booking?.journey_date}`,
        url: window.location.href
      });
    } else {
      showSuccess('Booking details copied to clipboard');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Warning color="warning" />;
      case 'cancelled':
        return <Error color="error" />;
      default:
        return <Schedule color="info" />;
    }
  };

  const getStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Alert severity="error">
        Booking not found. Please check the booking ID and try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Booking Details
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Booking #{booking.id}
      </Typography>

      <Grid container spacing={4}>
        {/* Booking Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getStatusIcon(booking.status)}
                  <Box>
                    <Typography variant="h6">
                      {booking.train_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Train #{booking.train_number}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={booking.status.toUpperCase()}
                  color={getStatusColor(booking.status)}
                  size="large"
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <LocationOn color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        From
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {booking.from_station}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <LocationOn color="secondary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        To
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {booking.to_station}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Schedule color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Journey Date
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(booking.journey_date)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Payment color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        LKR {booking.total_amount}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Journey Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Journey Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {formatTime(booking.departure_time)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Departure
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h4" color="secondary" gutterBottom>
                      {formatTime(booking.arrival_time)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Arrival
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Passengers
              </Typography>
              
              <List dense>
                {booking.passengers.map((passenger, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Person color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={passenger.name}
                      secondary={`Age: ${passenger.age} • Gender: ${passenger.gender} • Seat: ${passenger.seat_number || 'TBD'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrintTicket}
                  fullWidth
                >
                  Print Ticket
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadTicket}
                  fullWidth
                >
                  Download PDF
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={handleShareBooking}
                  fullWidth
                >
                  Share Booking
                </Button>
                
                {booking.status === 'confirmed' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setShowCancelDialog(true)}
                    fullWidth
                  >
                    Cancel Booking
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Payment color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Payment Method"
                    secondary={booking.payment_method}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Receipt color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Payment Status"
                    secondary={booking.payment_status}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Booked On"
                    secondary={formatDate(booking.created_at)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={20} /> : <Cancel />}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingView; 