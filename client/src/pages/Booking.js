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
import { trainService } from '../services/trainService';
import { bookingService } from '../services/bookingService';
import { stationService } from '../services/stationService';

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
    class: '',
    payment_method: 'credit_card'
  });
  const [availableTrains, setAvailableTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    cardholder_name: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useAlert();

  // Load available trains and stations on component mount
  useEffect(() => {
    loadAvailableTrains();
    loadAvailableStations();
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
      const response = await trainService.getAllTrains();
      setAvailableTrains(response.data?.trains || []);
    } catch (error) {
      showError('Failed to load available trains');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStations = async () => {
    try {
      const response = await stationService.getAllStations();
      setAvailableStations(response.data?.stations || []);
    } catch (error) {
      console.error('Failed to load stations:', error);
    }
  };

  const handleNext = () => {
    // Validation for each step
    if (activeStep === 0) {
      // Step 1: Select Journey - validate train selection
      if (!selectedTrain || !bookingData.train_id) {
        showError('Please select a train journey before proceeding');
        return;
      }
      if (!bookingData.from_station || !bookingData.to_station) {
        showError('Please select departure and arrival stations');
        return;
      }
    } else if (activeStep === 1) {
      // Step 2: Passenger Details - validate passenger information
      if (bookingData.passengers.length === 0) {
        showError('Please add at least one passenger');
        return;
      }
      for (const passenger of bookingData.passengers) {
        if (!passenger.name || !passenger.age || !passenger.gender) {
          showError('Please fill in all passenger details');
          return;
        }
      }
    } else if (activeStep === 2) {
      // Step 3: Seat Selection - validate class and seat selection
      if (!bookingData.class) {
        showError('Please select a travel class (First, Second, or Third)');
        return;
      }
      if (bookingData.passengers.length === 0) {
        showError('Please add passengers in the previous step');
        return;
      }
      if (bookingData.selected_seats.length !== bookingData.passengers.length) {
        showError(`Please select exactly ${bookingData.passengers.length} seat(s) for your passengers`);
        return;
      }
    } else if (activeStep === 3) {
      // Step 4: Payment - validate payment details
      const missingFields = [];
      if (!paymentData.card_number?.trim()) missingFields.push('Card Number');
      if (!paymentData.expiry_date?.trim()) missingFields.push('Expiry Date');
      if (!paymentData.cvv?.trim()) missingFields.push('CVV');
      if (!paymentData.cardholder_name?.trim()) missingFields.push('Cardholder Name');

      if (missingFields.length > 0) {
        showError(`Please fill in the following payment details: ${missingFields.join(', ')}`);
        return;
      }

      // Additional format validation
      if (paymentData.card_number.replace(/\s/g, '').length < 13) {
        showError('Please enter a valid card number (at least 13 digits)');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(paymentData.expiry_date)) {
        showError('Please enter expiry date in MM/YY format');
        return;
      }
      if (paymentData.cvv.length < 3) {
        showError('Please enter a valid CVV (3-4 digits)');
        return;
      }
    }

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

    if (!bookingData.class) {
      showError('Please select a travel class');
      return;
    }

    setLoading(true);

    try {
      // Find station IDs from station names
      const fromStation = availableStations.find(s => s.name === bookingData.from_station);
      const toStation = availableStations.find(s => s.name === bookingData.to_station);

      console.log('Available stations:', availableStations);
      console.log('Looking for from station:', bookingData.from_station);
      console.log('Looking for to station:', bookingData.to_station);
      console.log('Found from station:', fromStation);
      console.log('Found to station:', toStation);

      if (!fromStation || !toStation) {
        showError(`Invalid station selection. From: ${bookingData.from_station}, To: ${bookingData.to_station}. Please try again.`);
        return;
      }

      const bookingPayload = {
        trainId: parseInt(bookingData.train_id),
        fromStationId: fromStation.id,
        toStationId: toStation.id,
        travelDate: bookingData.journey_date.toISOString().split('T')[0],
        passengers: bookingData.passengers,
        classType: bookingData.class,
        selectedSeats: bookingData.selected_seats,
        paymentMethod: bookingData.payment_method,
        paymentData: paymentData
      };

      console.log('Booking payload:', bookingPayload);
      const response = await bookingService.createBooking(bookingPayload);

      showSuccess('Booking confirmed successfully!');
      navigate(`/booking/${response.data.booking.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedTrain || bookingData.passengers.length === 0) return 0;

    // Get price based on selected class
    let classPrice = 1500; // Default Second Class price
    switch (bookingData.class) {
      case 'first':
        classPrice = 2500;
        break;
      case 'second':
        classPrice = 1500;
        break;
      case 'third':
        classPrice = 800;
        break;
      default:
        classPrice = selectedTrain.base_price || 1500;
    }

    return classPrice * bookingData.passengers.length;
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Your Journey
            </Typography>

            {/* Station Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>From Station</InputLabel>
                    <Select
                      value={bookingData.from_station}
                      label="From Station"
                      onChange={(e) => setBookingData(prev => ({ ...prev, from_station: e.target.value }))}
                    >
                      {availableStations.map((station) => (
                        <MenuItem key={station.id} value={station.name}>
                          {station.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>To Station</InputLabel>
                    <Select
                      value={bookingData.to_station}
                      label="To Station"
                      onChange={(e) => setBookingData(prev => ({ ...prev, to_station: e.target.value }))}
                    >
                      {availableStations.map((station) => (
                        <MenuItem key={station.id} value={station.name}>
                          {station.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Journey Date"
                    value={bookingData.journey_date.toISOString().split('T')[0]}
                    onChange={(e) => setBookingData(prev => ({ ...prev, journey_date: new Date(e.target.value) }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Available Trains */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Available Trains
            </Typography>
            {availableTrains.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                {loading ? 'Loading available trains...' : 'No trains available. Please check your route and try again.'}
              </Alert>
            ) : null}
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
                            Train #{train.number}
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
                            {train.departure_time || '06:00 AM'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Arrival
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {train.arrival_time || '09:30 AM'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="h6" color="primary">
                        LKR {train.base_price || '1,500'}
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
              Seat Selection & Class
            </Typography>

            {/* Class Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Travel Class
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: bookingData.class === 'first' ? 2 : 1,
                      borderColor: bookingData.class === 'first' ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => setBookingData(prev => ({ ...prev, class: 'first' }))}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">First Class</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Air-conditioned, comfortable seats
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        LKR 2,500
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: bookingData.class === 'second' ? 2 : 1,
                      borderColor: bookingData.class === 'second' ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => setBookingData(prev => ({ ...prev, class: 'second' }))}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">Second Class</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reserved seating, good comfort
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        LKR 1,500
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: bookingData.class === 'third' ? 2 : 1,
                      borderColor: bookingData.class === 'third' ? 'primary.main' : 'grey.300'
                    }}
                    onClick={() => setBookingData(prev => ({ ...prev, class: 'third' }))}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">Third Class</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Basic seating, economical
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        LKR 800
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Seat Selection */}
            {bookingData.class && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Seats ({bookingData.class.charAt(0).toUpperCase() + bookingData.class.slice(1)} Class)
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

                {bookingData.selected_seats.length > 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Selected seats: {bookingData.selected_seats.map(seat => seat + 1).join(', ')}
                  </Alert>
                )}
              </Paper>
            )}
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
                          onChange={(e) => {
                            // Format card number with spaces
                            const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                            if (value.replace(/\s/g, '').length <= 16) {
                              handlePaymentChange('card_number', value);
                            }
                          }}
                          placeholder="1234 5678 9012 3456"
                          inputProps={{ maxLength: 19 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Expiry Date"
                          value={paymentData.expiry_date}
                          onChange={(e) => {
                            // Format expiry date as MM/YY
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2, 4);
                            }
                            handlePaymentChange('expiry_date', value);
                          }}
                          placeholder="MM/YY"
                          inputProps={{ maxLength: 5 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="CVV"
                          value={paymentData.cvv}
                          onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) {
                              handlePaymentChange('cvv', value);
                            }
                          }}
                          placeholder="123"
                          inputProps={{ maxLength: 4 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Cardholder Name"
                          value={paymentData.cardholder_name}
                          onChange={(e) => handlePaymentChange('cardholder_name', e.target.value)}
                          placeholder="John Doe"
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