import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  // Show success alert
  const showSuccess = (message, duration = 4000) => {
    addAlert('success', message, duration);
  };

  // Show error alert
  const showError = (message, duration = 6000) => {
    addAlert('error', message, duration);
  };

  // Show warning alert
  const showWarning = (message, duration = 5000) => {
    addAlert('warning', message, duration);
  };

  // Show info alert
  const showInfo = (message, duration = 4000) => {
    addAlert('info', message, duration);
  };

  // Add alert to queue
  const addAlert = (severity, message, duration) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      severity,
      message,
      duration
    };

    setAlerts(prev => [...prev, newAlert]);

    // If no alert is currently showing, show this one
    if (!currentAlert) {
      showNextAlert();
    }
  };

  // Show next alert in queue
  const showNextAlert = () => {
    if (alerts.length > 0) {
      const nextAlert = alerts[0];
      setCurrentAlert(nextAlert);
      setOpen(true);
      setAlerts(prev => prev.slice(1));
    }
  };

  // Handle alert close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setCurrentAlert(null);
    
    // Show next alert after a short delay
    setTimeout(() => {
      showNextAlert();
    }, 300);
  };

  // Clear all alerts
  const clearAll = () => {
    setAlerts([]);
    setOpen(false);
    setCurrentAlert(null);
  };

  // Clear specific alert
  const clearAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
    clearAlert,
    alerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {currentAlert && (
        <Snackbar
          open={open}
          autoHideDuration={currentAlert.duration}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MuiAlert
            onClose={handleClose}
            severity={currentAlert.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {currentAlert.message}
          </MuiAlert>
        </Snackbar>
      )}
    </AlertContext.Provider>
  );
}; 