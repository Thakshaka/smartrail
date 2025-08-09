import api from './api';

export const trackingService = {
  // Get live train locations
  getLiveTrainLocations: async () => {
    const response = await api.get('/tracking/live');
    return response.data;
  },

  // Get train tracking data
  getTrainTracking: async (trainId) => {
    const response = await api.get(`/tracking/train/${trainId}`);
    return response.data;
  },

  // Get tracking history
  getTrackingHistory: async (trainId, date) => {
    const response = await api.get(`/tracking/history/${trainId}`, {
      params: { date }
    });
    return response.data;
  },

  // Update train location (admin only)
  updateTrainLocation: async (trainId, locationData) => {
    const response = await api.post(`/tracking/update/${trainId}`, locationData);
    return response.data;
  }
};
