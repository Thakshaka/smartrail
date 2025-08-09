import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Train,
  Schedule,
  LocationOn,
  FilterList,
  Clear
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAlert } from '../contexts/AlertContext';
import { stationService } from '../services/stationService';
import { trainService } from '../services/trainService';

const Search = () => {
  const [searchData, setSearchData] = useState({
    from_station: '',
    to_station: '',
    date: new Date(),
    train_type: 'all'
  });
  const [stations, setStations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { showError } = useAlert();

  // Load stations on component mount
  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationService.getAllStations();
      setStations(response.data.stations || []);
    } catch (error) {
      showError('Failed to load stations');
      console.error('Station loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchData.from_station || !searchData.to_station) {
      showError('Please select both origin and destination stations');
      return;
    }

    if (!searchData.date) {
      showError('Please select a travel date');
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const params = {
        q: `${searchData.from_station} to ${searchData.to_station}`,
        from_station: searchData.from_station,
        to_station: searchData.to_station,
        date: searchData.date.toISOString().split('T')[0],
        train_type: searchData.train_type !== 'all' ? searchData.train_type : undefined
      };

      const response = await trainService.searchTrains(params);
      setSearchResults(response.results || []);
    } catch (error) {
      showError('Failed to search trains');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSearchData({
      from_station: '',
      to_station: '',
      date: new Date(),
      train_type: 'all'
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTrainTypeColor = (type) => {
    switch (type) {
      case 'Express':
        return 'primary';
      case 'Local':
        return 'secondary';
      case 'Intercity':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Trains
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Find trains between stations and book your journey
      </Typography>

      {/* Search Form */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={stations}
              getOptionLabel={(option) => option.name}
              value={stations.find(s => s.name === searchData.from_station) || null}
              onChange={(event, newValue) => {
                setSearchData(prev => ({
                  ...prev,
                  from_station: newValue ? newValue.name : ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="From Station"
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <LocationOn color="action" sx={{ mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Autocomplete
              options={stations}
              getOptionLabel={(option) => option.name}
              value={stations.find(s => s.name === searchData.to_station) || null}
              onChange={(event, newValue) => {
                setSearchData(prev => ({
                  ...prev,
                  to_station: newValue ? newValue.name : ''
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="To Station"
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <LocationOn color="action" sx={{ mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Travel Date"
                value={searchData.date}
                onChange={(newValue) => {
                  setSearchData(prev => ({
                    ...prev,
                    date: newValue
                  }));
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={new Date()}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Train Type</InputLabel>
              <Select
                value={searchData.train_type}
                label="Train Type"
                onChange={(e) => setSearchData(prev => ({
                  ...prev,
                  train_type: e.target.value
                }))}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Express">Express</MenuItem>
                <MenuItem value="Local">Local</MenuItem>
                <MenuItem value="Intercity">Intercity</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSearch}
                disabled={searching}
                startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
              <Tooltip title="Clear Search">
                <IconButton onClick={handleClear} color="secondary">
                  <Clear />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Search Results */}
      {hasSearched && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2">
              Search Results
            </Typography>
            {searchResults.length > 0 && (
              <Chip
                label={`${searchResults.length} train(s) found`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          {searchResults.length === 0 ? (
            <Alert severity="info">
              No trains found for the selected criteria. Please try different stations or date.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {searchResults.map((train, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {train.train_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Train #{train.train_number}
                          </Typography>
                        </Box>
                        <Chip
                          label={train.train_type}
                          color={getTrainTypeColor(train.train_type)}
                          size="small"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Schedule sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              Departure
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="medium">
                            {formatTime(train.departure_time)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Schedule sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              Arrival
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="medium">
                            {formatTime(train.arrival_time)}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Route: {train.origin_station} → {train.destination_station}
                        </Typography>
                        {train.distance_km && (
                          <Typography variant="body2" color="text.secondary">
                            Distance: {train.distance_km} km
                          </Typography>
                        )}
                        {train.estimated_duration_minutes && (
                          <Typography variant="body2" color="text.secondary">
                            Duration: {Math.floor(train.estimated_duration_minutes / 60)}h {train.estimated_duration_minutes % 60}m
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Train />}
                          fullWidth
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                        >
                          Book Now
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Popular Routes */}
      {!hasSearched && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Popular Routes
          </Typography>
          <Grid container spacing={2}>
            {[
              { from: 'Colombo Fort', to: 'Kandy' },
              { from: 'Colombo Fort', to: 'Galle' },
              { from: 'Kandy', to: 'Jaffna' },
              { from: 'Colombo Fort', to: 'Jaffna' }
            ].map((route, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'primary.light', color: 'white' },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    setSearchData({
                      from_station: route.from,
                      to_station: route.to,
                      date: new Date(),
                      train_type: 'all'
                    });
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="inherit">
                      {route.from} → {route.to}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Search;