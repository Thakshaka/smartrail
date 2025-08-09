import api from './api';

export const trainService = {
  // Get all trains
  getAllTrains: async () => {
    const response = await api.get('/trains');
    return response.data;
  },

  // Search trains
  searchTrains: async (searchParams) => {
    const response = await api.get('/trains/search', { params: searchParams });
    return response.data;
  },

  // Get train by ID
  getTrainById: async (trainId) => {
    const response = await api.get(`/trains/${trainId}`);
    return response.data;
  },

  // Get train schedule
  getTrainSchedule: async (trainId) => {
    const response = await api.get(`/trains/${trainId}/schedule`);
    return response.data;
  },

  // Get train route
  getTrainRoute: async (trainId) => {
    const response = await api.get(`/trains/${trainId}/route`);
    return response.data;
  }
};
