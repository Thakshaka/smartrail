import api from './api';

export const alertService = {
  // Get all alerts
  getAllAlerts: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  // Get alert by ID
  getAlertById: async (id) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },

  // Mark alert as read
  markAsRead: async (id) => {
    const response = await api.patch(`/alerts/${id}/read`);
    return response.data;
  },

  // Mark all alerts as read
  markAllAsRead: async () => {
    const response = await api.patch('/alerts/mark-all-read');
    return response.data;
  },

  // Dismiss alert
  dismissAlert: async (id) => {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  }
};
