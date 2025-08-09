const express = require('express');
const { query } = require('express-validator');
const predictionService = require('../services/predictionService');
const Train = require('../models/Train');
const Station = require('../models/Station');
const logger = require('../utils/logger');

const router = express.Router();

// Get prediction for specific train and station
router.get('/train/:trainId/station/:stationId', async (req, res) => {
  try {
    const { trainId, stationId } = req.params;

    // Validate train and station exist
    const train = await Train.findById(trainId);
    const station = await Station.findById(stationId);

    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get prediction
    const prediction = await predictionService.getPrediction(trainId, stationId);

    res.json({
      success: true,
      data: {
        train: {
          id: train.id,
          number: train.number,
          name: train.name
        },
        station: {
          id: station.id,
          name: station.name,
          code: station.code
        },
        prediction
      }
    });

  } catch (error) {
    logger.error('Get prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all predictions for a train
router.get('/train/:trainId', async (req, res) => {
  try {
    const { trainId } = req.params;

    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const predictions = await train.getPredictions();

    res.json({
      success: true,
      data: {
        train: {
          id: train.id,
          number: train.number,
          name: train.name
        },
        predictions,
        count: predictions.length
      }
    });

  } catch (error) {
    logger.error('Get train predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all predictions for a station
router.get('/station/:stationId', [
  query('hours').optional().isInt({ min: 1, max: 24 }).withMessage('Hours must be between 1-24')
], async (req, res) => {
  try {
    const { stationId } = req.params;
    const hours = parseInt(req.query.hours) || 12;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get predictions for the station
    const result = await require('../config/database').query(
      `SELECT p.*, t.number, t.name, t.type
       FROM predictions p
       JOIN trains t ON p.train_id = t.id
       WHERE p.station_id = $1 
       AND p.predicted_time > NOW()
       AND p.predicted_time < NOW() + INTERVAL '${hours} hours'
       ORDER BY p.predicted_time`,
      [stationId]
    );

    const predictions = result.rows;

    res.json({
      success: true,
      data: {
        station: {
          id: station.id,
          name: station.name,
          code: station.code
        },
        predictions,
        count: predictions.length,
        hoursAhead: hours
      }
    });

  } catch (error) {
    logger.error('Get station predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get prediction accuracy metrics
router.get('/accuracy/metrics', [
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1-90')
], async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const accuracy = await predictionService.getPredictionAccuracy(days);

    res.json({
      success: true,
      data: {
        accuracy,
        period_days: days,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get prediction accuracy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update prediction with actual arrival time
router.put('/:predictionId/actual', [
  require('../middleware/auth'), // Require authentication for updates
  require('express-validator').body('actualArrivalTime').isISO8601().withMessage('Valid arrival time is required')
], async (req, res) => {
  try {
    const errors = require('express-validator').validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { predictionId } = req.params;
    const { actualArrivalTime } = req.body;

    // Update prediction with actual arrival time
    const result = await require('../config/database').query(
      `UPDATE predictions 
       SET actual_arrival_time = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [actualArrivalTime, predictionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    const updatedPrediction = result.rows[0];

    logger.info(`Prediction updated with actual arrival: ${predictionId}`);

    res.json({
      success: true,
      message: 'Prediction updated with actual arrival time',
      data: {
        prediction: updatedPrediction
      }
    });

  } catch (error) {
    logger.error('Update prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get delay statistics
router.get('/delays/stats', [
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1-90')
], async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const result = await require('../config/database').query(
      `SELECT 
        COUNT(*) as total_predictions,
        AVG(delay_minutes) as avg_delay,
        MAX(delay_minutes) as max_delay,
        COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) as on_time_count,
        COUNT(CASE WHEN delay_minutes BETWEEN 6 AND 15 THEN 1 END) as minor_delay_count,
        COUNT(CASE WHEN delay_minutes > 15 THEN 1 END) as major_delay_count,
        AVG(confidence_score) as avg_confidence
       FROM predictions 
       WHERE created_at > NOW() - INTERVAL '${days} days'`
    );

    const stats = result.rows[0];
    
    // Calculate percentages
    const total = parseInt(stats.total_predictions);
    const onTimePercentage = total > 0 ? (stats.on_time_count / total) * 100 : 0;
    const minorDelayPercentage = total > 0 ? (stats.minor_delay_count / total) * 100 : 0;
    const majorDelayPercentage = total > 0 ? (stats.major_delay_count / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        statistics: {
          ...stats,
          on_time_percentage: Math.round(onTimePercentage * 100) / 100,
          minor_delay_percentage: Math.round(minorDelayPercentage * 100) / 100,
          major_delay_percentage: Math.round(majorDelayPercentage * 100) / 100,
          avg_delay: Math.round(parseFloat(stats.avg_delay) * 100) / 100,
          avg_confidence: Math.round(parseFloat(stats.avg_confidence) * 100) / 100
        },
        period_days: days,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get delay statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Trigger prediction update for specific train
router.post('/update/train/:trainId', [
  require('../middleware/auth')
], async (req, res) => {
  try {
    const { trainId } = req.params;

    const train = await Train.findById(trainId);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Update predictions for this train
    await predictionService.updateTrainPredictions(trainId);

    logger.info(`Prediction update triggered for train ${trainId}`);

    res.json({
      success: true,
      message: 'Prediction update triggered successfully',
      data: {
        trainId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Trigger prediction update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
