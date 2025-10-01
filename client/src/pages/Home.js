import React from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia, Container, Paper, Stack, Chip,
  Fade, Slide, useTheme, useMediaQuery, alpha
} from '@mui/material';
import {
  Train, Search, BookOnline, Notifications, Speed, LocationOn, Schedule, Security,
  TrendingUp, Verified, Star, ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import Sri Lankan train background image
import srilankanTrainBackground from '../assets/srilankan-train.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        backgroundImage: `linear-gradient(135deg, rgba(26, 35, 126, 0.85) 0%, rgba(83, 75, 174, 0.8) 50%, rgba(255, 111, 0, 0.7) 100%), url(${srilankanTrainBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(26,35,126,0.1) 0%, rgba(255,111,0,0.1) 100%)',
          zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Slide direction="up" in timeout={1200}>
                <Typography 
                  variant={isMobile ? "h3" : "h2"} 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #ffffff 30%, #ff6f00 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  Welcome to SmartRail
                </Typography>
              </Slide>
              <Slide direction="up" in timeout={1400}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  gutterBottom 
                  sx={{ 
                    mb: 4, 
                    opacity: 0.95,
                    fontWeight: 400,
                    maxWidth: '800px',
                    mx: 'auto'
                  }}
                >
                  Experience the future of railway travel with real-time tracking, AI-powered predictions, and seamless booking
                </Typography>
              </Slide>
              <Slide direction="up" in timeout={1600}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3} 
                  justifyContent="center" 
                  flexWrap="wrap"
                  sx={{ mt: 4 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/search')}
                    endIcon={<ArrowForward />}
                    sx={{ 
                      minWidth: 200,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #ff6f00 30%, #ff9f40 90%)',
                      boxShadow: '0 8px 32px rgba(255, 111, 0, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #e65100 30%, #ff6f00 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(255, 111, 0, 0.4)',
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Search Trains
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/tracking')}
                    endIcon={<Train />}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'white',
                      borderColor: 'white',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Track Trains
                  </Button>
                </Stack>
              </Slide>
            </Box>
          </Fade>
        </Container>
      </Paper>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Grid container spacing={4} sx={{ mt: -6, position: 'relative', zIndex: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Slide direction="up" in timeout={1800 + index * 200}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    p: 4,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{
                      background: 'linear-gradient(45deg, #1a237e 30%, #ff6f00 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 800,
                      mb: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Card>
              </Slide>
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
    </Box>
  );
};

export default Home;