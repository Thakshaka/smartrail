const express = require('express');
const { query, body, validationResult } = require('express-validator');
const trackingService = require('../services/trackingService');
const socketService = require('../services/socketService');
const Train = require('../models/Train');
const logger = require('../utils/logger');

const router = express.Router();

// Get live train locations
router.get('/live', async (req, res) => {
  try {
    const liveLocations = await trackingService.getLiveTrainLocations();

    res.json({
      success: true,
      data: {
        trains: liveLocations,
        count: liveLocations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get live locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific train tracking
router.get('/train/:trainId', [
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168')
], async (req, res) => {
  try {
    const { trainId } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const trackingHistory = await trackingService.getTrainTrackingHistory(trainId, hours);
    const currentLocation = await train.getCurrentLocation();

    res.json({
      success: true,
      data: {
        train: {
          id: train.id,
          number: train.number,
          name: train.name,
          status: train.status
        },
        currentLocation,
        trackingHistory,
        hoursBack: hours,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get train tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get train tracking by number
router.get('/train/number/:trainNumber', [
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168')
], async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    const train = await Train.findByNumber(trainNumber);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const trackingHistory = await trackingService.getTrainTrackingHistory(train.id, hours);
    const currentLocation = await train.getCurrentLocation();

    res.json({
      success: true,
      data: {
        train: {
          id: train.id,
          number: train.number,
          name: train.name,
          status: train.status
        },
        currentLocation,
        trackingHistory,
        hoursBack: hours,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get train tracking by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get station tracking (trains at station)
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;

    const result = await require('../config/database').query(
      `SELECT t.*, td.arrival_time, td.departure_time, td.platform, td.timestamp
       FROM trains t
       JOIN tracking_data td ON t.id = td.train_id
       WHERE td.station_id = $1
       AND td.timestamp > NOW() - INTERVAL '1 hour'
       ORDER BY td.timestamp DESC`,
      [stationId]
    );

    const trainsAtStation = result.rows;

    res.json({
      success: true,
      data: {
        stationId,
        trains: trainsAtStation,
        count: trainsAtStation.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get station tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get route tracking (all trains on a route)
router.get('/route/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;

    const result = await require('../config/database').query(
      `SELECT t.*, td.latitude, td.longitude, td.speed, td.timestamp,
              s.name as current_station_name
       FROM trains t
       LEFT JOIN tracking_data td ON t.id = td.train_id
       LEFT JOIN stations s ON td.station_id = s.id
       WHERE t.route_id = $1
       AND (td.id IS NULL OR td.id IN (
         SELECT DISTINCT ON (train_id) id
         FROM tracking_data
         WHERE timestamp > NOW() - INTERVAL '30 minutes'
         ORDER BY train_id, timestamp DESC
       ))
       ORDER BY t.number`,
      [routeId]
    );

    const trainsOnRoute = result.rows;

    res.json({
      success: true,
      data: {
        routeId,
        trains: trainsOnRoute,
        count: trainsOnRoute.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get route tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get tracking statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await require('../config/database').query(`
      SELECT
        COUNT(DISTINCT train_id) as active_trains,
        COUNT(*) as total_tracking_points,
        AVG(speed) as avg_speed,
        MAX(timestamp) as last_update
      FROM tracking_data
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    `);

    const delayStats = await require('../config/database').query(`
      SELECT
        COUNT(*) as total_trains,
        COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_trains,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_trains,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_trains
      FROM trains
    `);

    res.json({
      success: true,
      data: {
        tracking: stats.rows[0],
        delays: delayStats.rows[0],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get tracking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Manual location update (for testing/admin)
router.post('/update/:trainId', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be positive'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0-360'),
  body('stationId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { trainId } = req.params;
    const { latitude, longitude, speed, heading, stationId } = req.body;

    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Save tracking data
    await require('../config/database').query(
      `INSERT INTO tracking_data (
        train_id, latitude, longitude, speed, heading, station_id, accuracy, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [trainId, latitude, longitude, speed || 0, heading || 0, stationId, 5]
    );

    // Broadcast update
    const locationData = {
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      stationId,
      timestamp: new Date().toISOString()
    };

    socketService.broadcastTrainUpdate(trainId, locationData);

    logger.info(`Manual location update for train ${trainId}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: { locationData }
    });

  } catch (error) {
    logger.error('Manual location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
