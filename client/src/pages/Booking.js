import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Train,
  Person,
  Payment,
  CheckCircle,
  Schedule,
  LocationOn,
  Chair,
  CreditCard
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';
import axios from 'axios';

const steps = ['Select Journey', 'Passenger Details', 'Seat Selection', 'Payment', 'Confirmation'];

const Booking = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    train_id: '',
    journey_date: new Date(),
    from_station: '',
    to_station: '',
    passengers: [],
    selected_seats: [],
    payment_method: 'credit_card'
  });
  const [availableTrains, setAvailableTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    cardholder_name: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useAlert();

  // Load available trains on component mount
  useEffect(() => {
    loadAvailableTrains();
  }, []);

  // Initialize booking data from URL params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const trainId = params.get('train_id');
    const fromStation = params.get('from');
    const toStation = params.get('to');
    const date = params.get('date');

    if (trainId && fromStation && toStation) {
      setBookingData(prev => ({
        ...prev,
        train_id: trainId,
        from_station: fromStation,
        to_station: toStation,
        journey_date: date ? new Date(date) : new Date()
      }));
    }
  }, [location]);

  const loadAvailableTrains = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/trains');
      setAvailableTrains(response.data.trains);
    } catch (error) {
      showError('Failed to load available trains');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmitBooking();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTrainSelection = (train) => {
    setSelectedTrain(train);
    setBookingData(prev => ({
      ...prev,
      train_id: train.id
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...bookingData.passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
    setBookingData(prev => ({
      ...prev,
      passengers: updatedPassengers
    }));
  };

  const addPassenger = () => {
    setBookingData(prev => ({
      ...prev,
      passengers: [...prev.passengers, {
        name: '',
        age: '',
        gender: '',
        seat_preference: 'any'
      }]
    }));
  };

  const removePassenger = (index) => {
    setBookingData(prev => ({
      ...prev,
      passengers: prev.passengers.filter((_, i) => i !== index)
    }));
  };

  const handleSeatSelection = (seatId) => {
    setBookingData(prev => ({
      ...prev,
      selected_seats: prev.selected_seats.includes(seatId)
        ? prev.selected_seats.filter(id => id !== seatId)
        : [...prev.selected_seats, seatId]
    }));
  };

  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitBooking = async () => {
    if (!selectedTrain) {
      showError('Please select a train');
      return;
    }

    if (bookingData.passengers.length === 0) {
      showError('Please add at least one passenger');
      return;
    }

    if (bookingData.selected_seats.length !== bookingData.passengers.length) {
      showError('Please select seats for all passengers');
      return;
    }

    setLoading(true);

    try {
      const bookingPayload = {
        train_id: bookingData.train_id,
        journey_date: bookingData.journey_date.toISOString().split('T')[0],
        from_station: bookingData.from_station,
        to_station: bookingData.to_station,
        passengers: bookingData.passengers,
        selected_seats: bookingData.selected_seats,
        payment_method: bookingData.payment_method,
        payment_data: paymentData
      };

      const response = await axios.post('/api/bookings', bookingPayload);
      
      showSuccess('Booking confirmed successfully!');
      navigate(`/booking/${response.data.booking.id}`);
    } catch (error) {
      showError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedTrain) return 0;
    return selectedTrain.base_price * bookingData.passengers.length;
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Journey
            </Typography>
            <Grid container spacing={3}>
              {availableTrains.map((train) => (
                <Grid item xs={12} md={6} key={train.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedTrain?.id === train.id ? 2 : 1,
                      borderColor: selectedTrain?.id === train.id ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => handleTrainSelection(train)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {train.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Train #{train.train_number}
                          </Typography>
                        </Box>
                        <Chip label={train.type} color="primary" size="small" />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Departure
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {train.departure_time}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Arrival
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {train.arrival_time}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="h6" color="primary">
                        LKR {train.base_price}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Passenger Details
            </Typography>
            <Button 
              variant="outlined" 
              onClick={addPassenger}
              sx={{ mb: 3 }}
            >
              Add Passenger
            </Button>
            
            {bookingData.passengers.map((passenger, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Passenger {index + 1}
                    </Typography>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => removePassenger(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={passenger.gender}
                          label="Gender"
                          onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        >
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seat Selection
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Select {bookingData.passengers.length} seat(s) for your passengers
            </Alert>
            
            <Grid container spacing={2}>
              {Array.from({ length: 50 }, (_, i) => (
                <Grid item xs={2} sm={1} key={i}>
                  <Button
                    variant={bookingData.selected_seats.includes(i) ? "contained" : "outlined"}
                    size="small"
                    onClick={() => handleSeatSelection(i)}
                    disabled={bookingData.selected_seats.length >= bookingData.passengers.length && !bookingData.selected_seats.includes(i)}
                    sx={{ minWidth: 'auto', width: '100%' }}
                  >
                    {i + 1}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Payment Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Card Number"
                          value={paymentData.card_number}
                          onChange={(e) => handlePaymentChange('card_number', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Expiry Date"
                          value={paymentData.expiry_date}
                          onChange={(e) => handlePaymentChange('expiry_date', e.target.value)}
                          placeholder="MM/YY"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="CVV"
                          value={paymentData.cvv}
                          onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                          placeholder="123"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Cardholder Name"
                          value={paymentData.cardholder_name}
                          onChange={(e) => handlePaymentChange('cardholder_name', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Booking Summary
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Train"
                          secondary={selectedTrain?.name}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Passengers"
                          secondary={bookingData.passengers.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Seats"
                          secondary={bookingData.selected_seats.join(', ')}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText 
                          primary="Total Amount"
                          secondary={`LKR ${calculateTotalPrice()}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your booking has been successfully created. You will receive a confirmation email shortly.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Book Your Journey
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Reserve your train tickets with ease
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {renderStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              {activeStep === steps.length - 1 ? 'Confirm Booking' : 'Next'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Booking; 