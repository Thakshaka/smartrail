import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Schedule,
  Send,
  ContactSupport,
  Support
} from '@mui/icons-material';
import { useAlert } from '../contexts/AlertContext';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { showError, showSuccess } = useAlert();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccess('Message sent successfully! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      showError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Email color="primary" />,
      title: 'Email Support',
      details: 'support@smartrail.lk',
      description: 'Get help with your account and bookings'
    },
    {
      icon: <Phone color="primary" />,
      title: 'Phone Support',
      details: '+94 11 234 5678',
      description: 'Call us for urgent assistance'
    },
    {
      icon: <LocationOn color="primary" />,
      title: 'Head Office',
      details: 'Colombo Fort Railway Station, Colombo 01',
      description: 'Visit us for in-person support'
    },
    {
      icon: <Schedule color="primary" />,
      title: 'Support Hours',
      details: '24/7 Online Support',
      description: 'Phone: 6 AM - 10 PM (Daily)'
    }
  ];

  const faqItems = [
    {
      question: 'How do I book a train ticket?',
      answer: 'You can book tickets through our website by searching for trains, selecting your preferred journey, and completing the payment process.'
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel your booking up to 2 hours before departure. Cancellation fees may apply.'
    },
    {
      question: 'How accurate are the arrival predictions?',
      answer: 'Our ML-based predictions have an accuracy rate of over 85%. Predictions are updated in real-time based on current conditions.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit cards, debit cards, and bank transfers. All payments are processed securely.'
    },
    {
      question: 'How do I track my train?',
      answer: 'Use the tracking feature to see real-time location updates and arrival predictions for your train.'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Get in touch with our support team for assistance
      </Typography>

      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Contact Information
              </Typography>
              <List>
                {contactInfo.map((info, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {info.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={info.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {info.details}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {info.description}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < contactInfo.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Frequently Asked Questions
              </Typography>
              <List dense>
                {faqItems.map((faq, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ContactSupport color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={faq.question}
                      secondary={faq.answer}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Send us a Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill out the form below and we'll get back to you as soon as possible.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="subject"
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    error={!!errors.subject}
                    helperText={errors.subject}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="message"
                    label="Message"
                    name="message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    error={!!errors.message}
                    helperText={errors.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Emergency Contact */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Emergency:</strong> For urgent travel-related issues, call our 24/7 hotline at +94 11 234 5678
        </Typography>
      </Alert>
    </Box>
  );
};

export default Contact; 