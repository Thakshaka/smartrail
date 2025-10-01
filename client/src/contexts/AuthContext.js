import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage and optionally refresh profile
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      // We already seeded user from localStorage; try refreshing profile silently
      checkAuthStatus(true);
    }
    setLoading(false);
  }, []);

  // Check authentication status
  const checkAuthStatus = async (silent = false) => {
    try {
      const response = await authService.getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Do not force logout on transient failures; keep existing session
      if (!silent) setError('Session check failed. Using cached session.');
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login({ email, password });

      // Set user
      setUser(response.user);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);

      // Set user
      setUser(response.user);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Use auth service logout
      authService.logout();

      // Clear user
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await authService.updateProfile(profileData);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};