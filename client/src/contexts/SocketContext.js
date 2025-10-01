import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trainUpdates, setTrainUpdates] = useState({});
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: token ? { token } : undefined
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Train location updates
    newSocket.on('train_location_update', (payload) => {
      const { trainId, location } = payload || {};
      if (!trainId || !location) return;
      setTrainUpdates(prev => ({
        ...prev,
        [trainId]: {
          ...location,
          timestamp: new Date().toISOString()
        }
      }));
    });

    // Alert updates
    newSocket.on('new-alert', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    newSocket.on('new-general-alert', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Join train tracking room
  const joinTrainTracking = (trainId) => {
    if (socket && isConnected) {
      socket.emit('subscribe_train_tracking', trainId);
      console.log(`Joined tracking room for train ${trainId}`);
    }
  };

  // Leave train tracking room
  const leaveTrainTracking = (trainId) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_train_tracking', trainId);
      console.log(`Left tracking room for train ${trainId}`);
    }
  };

  // Join alerts room
  const joinAlerts = (userId) => {
    if (socket && isConnected) {
      socket.emit('join-alerts', userId);
      console.log(`Joined alerts room for user ${userId}`);
    }
  };

  // Leave alerts room
  const leaveAlerts = (userId) => {
    if (socket && isConnected) {
      socket.emit('leave-alerts', userId);
      console.log(`Left alerts room for user ${userId}`);
    }
  };

  // Get train update
  const getTrainUpdate = (trainId) => {
    return trainUpdates[trainId] || null;
  };

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Remove specific alert
  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Join user-specific rooms when user changes
  useEffect(() => {
    if (socket && isConnected && user) {
      joinAlerts(user.id);
    }

    return () => {
      if (socket && isConnected && user) {
        leaveAlerts(user.id);
      }
    };
  }, [socket, isConnected, user]);

  const value = {
    socket,
    isConnected,
    trainUpdates,
    alerts,
    joinTrainTracking,
    leaveTrainTracking,
    joinAlerts,
    leaveAlerts,
    getTrainUpdate,
    clearAlerts,
    removeAlert
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 