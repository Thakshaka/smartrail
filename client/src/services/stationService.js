import api from './api';

export const stationService = {
  // Get all stations
  getAllStations: async () => {
    const response = await api.get('/stations');
    return response.data;
  },

  // Get station by ID
  getStationById: async (stationId) => {
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  },

  // Search stations
  searchStations: async (query) => {
    const response = await api.get('/stations/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get trains at station
  getTrainsAtStation: async (stationId) => {
    const response = await api.get(`/stations/${stationId}/trains`);
    return response.data;
  }
};
