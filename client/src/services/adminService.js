import api from './api';

export const adminService = {
  // Dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // User management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Train management
  getTrains: async () => {
    const response = await api.get('/admin/trains');
    return response.data;
  },

  updateTrainStatus: async (trainId, status) => {
    const response = await api.patch(`/admin/trains/${trainId}/status`, { status });
    return response.data;
  },

  // Booking management
  getBookings: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },

  updateBookingStatus: async (bookingId, status) => {
    const response = await api.patch(`/admin/bookings/${bookingId}/status`, { status });
    return response.data;
  }
};
