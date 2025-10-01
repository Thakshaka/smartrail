import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AlertProvider } from './contexts/AlertContext';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import Booking from './pages/Booking';
import Tracking from './pages/Tracking';
import Alerts from './pages/Alerts';
import UserProfile from './pages/UserProfile';
import BookingView from './pages/BookingView';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

// Import components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Create premium theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
      light: '#534bae',
      dark: '#000051',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6f00',
      light: '#ff9f40',
      dark: '#c43e00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    grey: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    success: {
      main: '#38a169',
      light: '#68d391',
      dark: '#2f855a',
    },
    warning: {
      main: '#ed8936',
      light: '#f6ad55',
      dark: '#dd6b20',
    },
    error: {
      main: '#e53e3e',
      light: '#fc8181',
      dark: '#c53030',
    },
    info: {
      main: '#3182ce',
      light: '#63b3ed',
      dark: '#2c5282',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
    '0 25px 50px rgba(0,0,0,0.25), 0 20px 20px rgba(0,0,0,0.15)',
    '0 30px 60px rgba(0,0,0,0.25), 0 25px 25px rgba(0,0,0,0.15)',
    '0 35px 70px rgba(0,0,0,0.25), 0 30px 30px rgba(0,0,0,0.15)',
    '0 40px 80px rgba(0,0,0,0.25), 0 35px 35px rgba(0,0,0,0.15)',
    '0 45px 90px rgba(0,0,0,0.25), 0 40px 40px rgba(0,0,0,0.15)',
    '0 50px 100px rgba(0,0,0,0.25), 0 45px 45px rgba(0,0,0,0.15)',
    '0 55px 110px rgba(0,0,0,0.25), 0 50px 50px rgba(0,0,0,0.15)',
    '0 60px 120px rgba(0,0,0,0.25), 0 55px 55px rgba(0,0,0,0.15)',
    '0 65px 130px rgba(0,0,0,0.25), 0 60px 60px rgba(0,0,0,0.15)',
    '0 70px 140px rgba(0,0,0,0.25), 0 65px 65px rgba(0,0,0,0.15)',
    '0 75px 150px rgba(0,0,0,0.25), 0 70px 70px rgba(0,0,0,0.15)',
    '0 80px 160px rgba(0,0,0,0.25), 0 75px 75px rgba(0,0,0,0.15)',
    '0 85px 170px rgba(0,0,0,0.25), 0 80px 80px rgba(0,0,0,0.15)',
    '0 90px 180px rgba(0,0,0,0.25), 0 85px 85px rgba(0,0,0,0.15)',
    '0 95px 190px rgba(0,0,0,0.25), 0 90px 90px rgba(0,0,0,0.15)',
    '0 100px 200px rgba(0,0,0,0.25), 0 95px 95px rgba(0,0,0,0.15)',
    '0 105px 210px rgba(0,0,0,0.25), 0 100px 100px rgba(0,0,0,0.15)',
    '0 110px 220px rgba(0,0,0,0.25), 0 105px 105px rgba(0,0,0,0.15)',
    '0 115px 230px rgba(0,0,0,0.25), 0 110px 110px rgba(0,0,0,0.15)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '12px 24px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        },
        contained: {
          boxShadow: '0 4px 14px rgba(26,35,126,0.25)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(26,35,126,0.35)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(26,35,126,0.15)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-label': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255,255,255,0.95)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <AlertProvider>
            <Router>
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/contact" element={<Contact />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/booking" 
                    element={
                      <ProtectedRoute>
                        <Booking />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/tracking" 
                    element={
                      <ProtectedRoute>
                        <Tracking />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/alerts" 
                    element={
                      <ProtectedRoute>
                        <Alerts />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/booking/:id"
                    element={
                      <ProtectedRoute>
                        <BookingView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          </AlertProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 