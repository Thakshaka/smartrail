import api from './api';

export const predictionService = {
  // Get predictions for a train
  getTrainPredictions: async (trainId) => {
    const response = await api.get(`/predictions/train/${trainId}`);
    return response.data;
  },

  // Trigger prediction update for a train (server will compute using ML or fallback)
  triggerPredictionUpdate: async (trainId) => {
    const response = await api.post(`/predictions/update/train/${trainId}`);
    return response.data;
  },

  // Get prediction for specific train and station
  getArrivalPrediction: async (trainId, stationId) => {
    const response = await api.get(`/predictions/train/${trainId}/station/${stationId}`);
    return response.data;
  },

  // Get prediction accuracy metrics
  getAccuracyMetrics: async () => {
    const response = await api.get('/predictions/accuracy/metrics');
    return response.data;
  }
};
