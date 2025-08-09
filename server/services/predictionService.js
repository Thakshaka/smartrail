const axios = require('axios');
const { query } = require('../config/database');
const Train = require('../models/Train');
const logger = require('../utils/logger');

class PredictionService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = process.env.ML_SERVICE_API_KEY;
  }

  // Get prediction for specific train and station
  async getPrediction(trainId, stationId) {
    try {
      // Get recent tracking data for the train
      const trackingData = await this.getTrainTrackingData(trainId);
      
      // Get historical data for this route
      const historicalData = await this.getHistoricalData(trainId, stationId);
      
      // Prepare data for ML model
      const predictionData = {
        train_id: trainId,
        station_id: stationId,
        current_location: trackingData.slice(0, 1)[0] || null,
        recent_tracking: trackingData,
        historical_data: historicalData,
        weather_data: await this.getWeatherData(),
        time_features: this.extractTimeFeatures()
      };

      // Call ML service
      const prediction = await this.callMLService('/predict', predictionData);
      
      // Save prediction to database
      await this.savePrediction(trainId, stationId, prediction);
      
      return prediction;

    } catch (error) {
      logger.error(`Error getting prediction for train ${trainId}, station ${stationId}:`, error);
      
      // Fallback to schedule-based prediction
      return await this.getFallbackPrediction(trainId, stationId);
    }
  }

  // Update all predictions for active trains
  async updateAllPredictions() {
    try {
      const activeTrains = await query(
        `SELECT id FROM trains WHERE status IN ('running', 'delayed', 'scheduled')`
      );

      for (const train of activeTrains.rows) {
        await this.updateTrainPredictions(train.id);
      }

      logger.info(`Updated predictions for ${activeTrains.rows.length} trains`);
    } catch (error) {
      logger.error('Error updating all predictions:', error);
    }
  }

  // Update predictions for a specific train
  async updateTrainPredictions(trainId) {
    try {
      const train = await Train.findById(trainId);
      if (!train) return;

      const schedule = await train.getSchedule();
      
      // Get predictions for upcoming stations
      for (const station of schedule) {
        const now = new Date();
        const stationTime = new Date(`${now.toDateString()} ${station.arrival_time}`);
        
        // Only predict for future stations
        if (stationTime > now) {
          await this.getPrediction(trainId, station.station_id);
        }
      }
    } catch (error) {
      logger.error(`Error updating predictions for train ${trainId}:`, error);
    }
  }

  // Get train tracking data for ML model
  async getTrainTrackingData(trainId, hours = 2) {
    const result = await query(
      `SELECT * FROM tracking_data 
       WHERE train_id = $1 AND timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC
       LIMIT 50`,
      [trainId]
    );
    
    return result.rows;
  }

  // Get historical data for route analysis
  async getHistoricalData(trainId, stationId, days = 30) {
    const result = await query(
      `SELECT td.*, p.predicted_time, p.actual_arrival_time
       FROM tracking_data td
       LEFT JOIN predictions p ON td.train_id = p.train_id AND td.station_id = p.station_id
       WHERE td.train_id = $1 AND td.station_id = $2 
       AND td.timestamp > NOW() - INTERVAL '${days} days'
       ORDER BY td.timestamp DESC`,
      [trainId, stationId]
    );
    
    return result.rows;
  }

  // Get weather data (mock implementation)
  async getWeatherData() {
    // In production, integrate with weather API
    return {
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      humidity: Math.floor(Math.random() * 40) + 60, // 60-100%
      rainfall: Math.random() * 10, // 0-10mm
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      conditions: ['clear', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)]
    };
  }

  // Extract time-based features
  extractTimeFeatures() {
    const now = new Date();
    return {
      hour: now.getHours(),
      day_of_week: now.getDay(),
      day_of_month: now.getDate(),
      month: now.getMonth() + 1,
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      is_peak_hour: (now.getHours() >= 7 && now.getHours() <= 9) || 
                    (now.getHours() >= 17 && now.getHours() <= 19)
    };
  }

  // Call ML service
  async callMLService(endpoint, data) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        timeout: 10000 // 10 second timeout
      });
      
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn('ML service is not available, using fallback prediction');
        throw new Error('ML service unavailable');
      }
      throw error;
    }
  }

  // Fallback prediction based on schedule
  async getFallbackPrediction(trainId, stationId) {
    try {
      const result = await query(
        `SELECT rs.arrival_time, rs.departure_time
         FROM route_stations rs
         JOIN trains t ON rs.route_id = t.route_id
         WHERE t.id = $1 AND rs.station_id = $2`,
        [trainId, stationId]
      );

      if (result.rows.length === 0) {
        throw new Error('No schedule data found');
      }

      const scheduledTime = result.rows[0].arrival_time;
      
      // Add random delay between 0-10 minutes for fallback
      const delayMinutes = Math.floor(Math.random() * 11);
      const scheduledDate = new Date(`1970-01-01T${scheduledTime}`);
      const predictedDate = new Date(scheduledDate.getTime() + (delayMinutes * 60000));
      
      return {
        predicted_time: predictedDate.toTimeString().slice(0, 8),
        confidence_score: 0.6, // Lower confidence for fallback
        delay_minutes: delayMinutes,
        prediction_method: 'schedule_based',
        factors: ['schedule_data']
      };
    } catch (error) {
      logger.error('Error in fallback prediction:', error);
      throw error;
    }
  }

  // Save prediction to database
  async savePrediction(trainId, stationId, prediction) {
    await query(
      `INSERT INTO predictions (
        train_id, station_id, predicted_time, confidence_score, 
        delay_minutes, prediction_method, factors, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (train_id, station_id, DATE(created_at))
      DO UPDATE SET
        predicted_time = EXCLUDED.predicted_time,
        confidence_score = EXCLUDED.confidence_score,
        delay_minutes = EXCLUDED.delay_minutes,
        prediction_method = EXCLUDED.prediction_method,
        factors = EXCLUDED.factors,
        updated_at = NOW()`,
      [
        trainId,
        stationId,
        prediction.predicted_time,
        prediction.confidence_score,
        prediction.delay_minutes,
        prediction.prediction_method,
        JSON.stringify(prediction.factors)
      ]
    );
  }

  // Get prediction accuracy metrics
  async getPredictionAccuracy(days = 7) {
    const result = await query(
      `SELECT 
        AVG(ABS(EXTRACT(EPOCH FROM (actual_arrival_time - predicted_time))/60)) as avg_error_minutes,
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN ABS(EXTRACT(EPOCH FROM (actual_arrival_time - predicted_time))/60) <= 5 THEN 1 END) as accurate_predictions
       FROM predictions 
       WHERE actual_arrival_time IS NOT NULL 
       AND created_at > NOW() - INTERVAL '${days} days'`
    );
    
    const stats = result.rows[0];
    const accuracy = stats.total_predictions > 0 
      ? (stats.accurate_predictions / stats.total_predictions) * 100 
      : 0;
    
    return {
      accuracy_percentage: Math.round(accuracy * 100) / 100,
      average_error_minutes: Math.round(stats.avg_error_minutes * 100) / 100,
      total_predictions: parseInt(stats.total_predictions),
      accurate_predictions: parseInt(stats.accurate_predictions)
    };
  }
}

// Create singleton instance
const predictionService = new PredictionService();

module.exports = predictionService;
