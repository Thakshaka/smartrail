import api from './api';

export const bookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Get user bookings
  getUserBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    const response = await api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  // Update booking
  updateBooking: async (bookingId, updateData) => {
    const response = await api.put(`/bookings/${bookingId}`, updateData);
    return response.data;
  },

  // Get available seats
  getAvailableSeats: async (trainId, date) => {
    const response = await api.get(`/bookings/available-seats`, {
      params: { trainId, date }
    });
    return response.data;
  }
};
