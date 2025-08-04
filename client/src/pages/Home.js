import React from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia, Container, Paper, Stack, Chip
} from '@mui/material';
import {
  Train, Search, BookOnline, Notifications, Speed, LocationOn, Schedule, Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import the background image
import homeBackground from '../assets/home-srilanka-train.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Train />,
      title: 'Real-time Tracking',
      description: 'Track trains in real-time with live location updates'
    },
    {
      icon: <Search />,
      title: 'Smart Search',
      description: 'Find trains between any stations with advanced filters'
    },
    {
      icon: <BookOnline />,
      title: 'Easy Booking',
      description: 'Book tickets online with secure payment options'
    },
    {
      icon: <Notifications />,
      title: 'Live Alerts',
      description: 'Get real-time notifications about delays and updates'
    },
    {
      icon: <Speed />,
      title: 'ML Predictions',
      description: 'AI-powered arrival time predictions with high accuracy'
    },
    {
      icon: <LocationOn />,
      title: 'Station Info',
      description: 'Complete information about all railway stations'
    }
  ];

  const stats = [
    { label: 'Active Trains', value: '150+' },
    { label: 'Stations', value: '460+' },
    { label: 'Daily Passengers', value: '300K+' },
    { label: 'Routes', value: '50+' }
  ];

  const techStack = [
    'React.js', 'Node.js', 'PostgreSQL', 'Socket.io', 'Material-UI', 'Python', 'Machine Learning'
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper sx={{ 
        position: 'relative',
        backgroundImage: `url(${homeBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome to SmartRail
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
              Real-time train tracking and intelligent booking system for Sri Lanka Railways
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/search')}
                sx={{ minWidth: 150 }}
              >
                Search Trains
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => navigate('/tracking')}
                sx={{ 
                  minWidth: 150,
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Track Trains
              </Button>
            </Stack>
          </Box>
        </Container>
      </Paper>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={4} sx={{ mt: -8, position: 'relative', zIndex: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h3" component="div" color="primary" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Why Choose SmartRail?
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Experience the future of railway travel in Sri Lanka
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    color: 'white',
                    mb: 2
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Paper sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        py: 6
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to Start Your Journey?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of passengers who trust SmartRail for their daily commute
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/register')}
                sx={{ 
                  minWidth: 150,
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Get Started
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => navigate('/contact')}
                sx={{ 
                  minWidth: 150,
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Contact Us
              </Button>
            </Stack>
          </Box>
        </Container>
      </Paper>

      {/* Technology Stack */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Built with Modern Technology
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 3 }}>
          {techStack.map((tech, index) => (
            <Chip 
              key={index}
              label={tech} 
              variant="outlined" 
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 