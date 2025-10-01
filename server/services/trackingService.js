const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const Train = require('../models/Train');
const socketService = require('./socketService');
const predictionService = require('./predictionService');
const logger = require('../utils/logger');

class TrackingService {
  constructor() {
    this.isRunning = false;
    this.trackingInterval = null;
    this.dataset = null; // optional ML/dataset-driven tracking points
    this.datasetIndexByTrainId = new Map();
    this.loadDatasetIfAvailable();
  }

  // Start real-time tracking service
  startRealTimeTracking(io) {
    if (this.isRunning) {
      logger.warn('Tracking service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚆 Starting real-time tracking service');

    // Update train locations every 30 seconds
    this.trackingInterval = setInterval(async () => {
      await this.updateAllTrainLocations();
    }, 30000);

    // Schedule prediction updates every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.updatePredictions();
    });

    // Schedule daily cleanup at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldData();
    });

    logger.info('✅ Real-time tracking service started');
  }

  // Stop tracking service
  stopRealTimeTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isRunning = false;
    logger.info('🛑 Real-time tracking service stopped');
  }

  // Update all train locations
  async updateAllTrainLocations() {
    try {
      const trains = await Train.findAll();
      
      for (const train of trains) {
        if (train.status === 'running' || train.status === 'delayed') {
          if (this.dataset) {
            await this.advanceFromDataset(train);
          } else {
            await this.simulateTrainMovement(train);
          }
        }
      }
    } catch (error) {
      logger.error('Error updating train locations:', error);
    }
  }

  // Load dataset if present (server/data/tracking_dataset.json)
  loadDatasetIfAvailable() {
    try {
      const datasetPath = path.join(__dirname, '..', 'data', 'tracking_dataset.json');
      if (fs.existsSync(datasetPath)) {
        const raw = fs.readFileSync(datasetPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.dataset = parsed; // { [trainId]: [ { latitude, longitude, speed, heading, stationId? } ] }
          logger.info('📈 Tracking dataset loaded for ML-driven updates');
        }
      }
    } catch (e) {
      logger.warn('Failed to load tracking dataset, falling back to simulation');
      this.dataset = null;
    }
  }

  // Advance one step for the given train using dataset
  async advanceFromDataset(train) {
    const trainId = String(train.id);
    const points = this.dataset?.[trainId];
    if (!Array.isArray(points) || points.length === 0) {
      return; // no dataset for this train
    }
    const currentIndex = this.datasetIndexByTrainId.get(trainId) ?? 0;
    const point = points[currentIndex % points.length];
    this.datasetIndexByTrainId.set(trainId, (currentIndex + 1) % points.length);

    const locationData = {
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
      speed: Number(point.speed) || 0,
      heading: Number(point.heading) || 0,
      stationId: point.stationId || null,
      estimatedArrival: point.estimatedArrival || null,
      accuracy: Number(point.accuracy) || 10
    };

    await this.saveTrackingData(train.id, locationData);
    socketService.broadcastTrainUpdate(train.id, locationData);
    // Proactively update predictions for this train based on new data
    try {
      await predictionService.updateTrainPredictions(train.id);
    } catch (e) {
      logger.warn(`Prediction update failed for train ${train.id}: ${e.message || e}`);
    }
  }

  // Simulate train movement (replace with real GPS data in production)
  async simulateTrainMovement(train) {
    try {
      const schedule = await train.getSchedule();
      const currentLocation = await train.getCurrentLocation();
      
      if (!schedule.length) return;

      // Find next station in route
      const currentTime = new Date();
      const nextStation = this.findNextStation(schedule, currentTime);
      
      if (!nextStation) return;

      // Generate simulated GPS coordinates
      const locationData = await this.generateLocationData(train, nextStation, currentLocation);
      
      // Save tracking data
      await this.saveTrackingData(train.id, locationData);
      
      // Broadcast location update
      socketService.broadcastTrainUpdate(train.id, locationData);
      
      // Check for delays and send alerts
      await this.checkForDelays(train, nextStation, locationData);
      
    } catch (error) {
      logger.error(`Error simulating movement for train ${train.id}:`, error);
    }
  }

  // Find next station based on current time
  findNextStation(schedule, currentTime) {
    const currentTimeStr = currentTime.toTimeString().slice(0, 8);
    
    for (const station of schedule) {
      if (station.departure_time > currentTimeStr) {
        return station;
      }
    }
    
    return null; // Train has completed its journey
  }

  // Generate simulated location data
  async generateLocationData(train, nextStation, currentLocation) {
    // In a real system, this would come from GPS devices
    // For simulation, we'll interpolate between stations
    
    const baseLatitude = 7.8731; // Central Sri Lanka
    const baseLongitude = 80.7718;
    
    // Add some randomness to simulate movement
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lonOffset = (Math.random() - 0.5) * 0.01;
    
    return {
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lonOffset,
      speed: Math.floor(Math.random() * 60) + 40, // 40-100 km/h
      heading: Math.floor(Math.random() * 360),
      stationId: nextStation.station_id,
      estimatedArrival: this.calculateEstimatedArrival(nextStation),
      accuracy: Math.floor(Math.random() * 10) + 5 // 5-15 meters
    };
  }

  // Calculate estimated arrival time
  calculateEstimatedArrival(station) {
    const scheduledTime = new Date(`1970-01-01T${station.arrival_time}`);
    const now = new Date();
    const currentTimeOfDay = new Date(`1970-01-01T${now.toTimeString().slice(0, 8)}`);
    
    // Add some random delay (0-15 minutes)
    const delayMinutes = Math.floor(Math.random() * 16);
    const estimatedTime = new Date(scheduledTime.getTime() + (delayMinutes * 60000));
    
    return estimatedTime.toTimeString().slice(0, 8);
  }

  // Save tracking data to database
  async saveTrackingData(trainId, locationData) {
    await query(
      `INSERT INTO tracking_data (
        train_id, latitude, longitude, speed, heading, station_id,
        estimated_arrival, accuracy, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        trainId,
        locationData.latitude,
        locationData.longitude,
        locationData.speed,
        locationData.heading,
        locationData.stationId,
        locationData.estimatedArrival,
        locationData.accuracy
      ]
    );
  }

  // Check for delays and send alerts
  async checkForDelays(train, nextStation, locationData) {
    const scheduledArrival = nextStation.arrival_time;
    const estimatedArrival = locationData.estimatedArrival;
    
    const scheduledTime = new Date(`1970-01-01T${scheduledArrival}`);
    const estimatedTime = new Date(`1970-01-01T${estimatedArrival}`);
    
    const delayMinutes = (estimatedTime - scheduledTime) / (1000 * 60);
    
    if (delayMinutes > 5) { // Alert if delay is more than 5 minutes
      const delayInfo = {
        trainId: train.id,
        trainNumber: train.number,
        trainName: train.name,
        stationId: nextStation.station_id,
        stationName: nextStation.station_name,
        scheduledArrival,
        estimatedArrival,
        delayMinutes: Math.round(delayMinutes),
        reason: this.generateDelayReason()
      };

      // Broadcast delay alert
      socketService.broadcastTrainDelay(train.id, delayInfo);
      
      // Update train status if significant delay
      if (delayMinutes > 15 && train.status !== 'delayed') {
        await train.updateStatus('delayed');
      }
      
      logger.info(`🚨 Delay alert: Train ${train.number} delayed by ${Math.round(delayMinutes)} minutes`);
    }
  }

  // Generate random delay reason (replace with real data in production)
  generateDelayReason() {
    const reasons = [
      'Signal failure',
      'Track maintenance',
      'Weather conditions',
      'Technical issues',
      'Heavy passenger traffic',
      'Operational delays'
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // Update ML predictions
  async updatePredictions() {
    try {
      logger.info('🤖 Updating ML predictions');
      await predictionService.updateAllPredictions();
    } catch (error) {
      logger.error('Error updating predictions:', error);
    }
  }

  // Cleanup old tracking data
  async cleanupOldData() {
    try {
      logger.info('🧹 Cleaning up old tracking data');
      
      // Delete tracking data older than 7 days
      await query(
        'DELETE FROM tracking_data WHERE timestamp < NOW() - INTERVAL \'7 days\''
      );
      
      // Delete old predictions
      await query(
        'DELETE FROM predictions WHERE predicted_time < NOW() - INTERVAL \'1 day\''
      );
      
      logger.info('✅ Old data cleanup completed');
    } catch (error) {
      logger.error('Error during data cleanup:', error);
    }
  }

  // Get live train locations
  async getLiveTrainLocations() {
    const result = await query(
      `SELECT DISTINCT ON (td.train_id) 
              td.*, t.number, t.name, t.status, s.name as station_name
       FROM tracking_data td
       JOIN trains t ON td.train_id = t.id
       LEFT JOIN stations s ON td.station_id = s.id
       WHERE td.timestamp > NOW() - INTERVAL '5 minutes'
       ORDER BY td.train_id, td.timestamp DESC`
    );
    
    return result.rows;
  }

  // Get train tracking history
  async getTrainTrackingHistory(trainId, hours = 24) {
    const result = await query(
      `SELECT td.*, s.name as station_name
       FROM tracking_data td
       LEFT JOIN stations s ON td.station_id = s.id
       WHERE td.train_id = $1 AND td.timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY td.timestamp DESC`,
      [trainId]
    );
    
    return result.rows;
  }
}

// Create singleton instance
const trackingService = new TrackingService();

module.exports = trackingService;
