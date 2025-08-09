const express = require('express');
const { query } = require('express-validator');
const Station = require('../models/Station');
const logger = require('../utils/logger');

const router = express.Router();

// Get all stations
router.get('/', async (req, res) => {
  try {
    const stations = await Station.findAll();

    res.json({
      success: true,
      data: {
        stations,
        count: stations.length
      }
    });

  } catch (error) {
    logger.error('Get stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search stations
router.get('/search', [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], async (req, res) => {
  try {
    const { q } = req.query;
    
    const stations = await Station.searchByName(q);

    res.json({
      success: true,
      data: {
        stations,
        count: stations.length,
        query: q
      }
    });

  } catch (error) {
    logger.error('Search stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get stations by city
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    const stations = await Station.findByCity(city);

    res.json({
      success: true,
      data: {
        stations,
        count: stations.length,
        city
      }
    });

  } catch (error) {
    logger.error('Get stations by city error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get stations by province
router.get('/province/:province', async (req, res) => {
  try {
    const { province } = req.params;
    
    const stations = await Station.findByProvince(province);

    res.json({
      success: true,
      data: {
        stations,
        count: stations.length,
        province
      }
    });

  } catch (error) {
    logger.error('Get stations by province error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific station
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get additional station data
    const currentTrains = await station.getCurrentTrains();
    const upcomingArrivals = await station.getUpcomingArrivals();
    const routes = await station.getRoutes();

    res.json({
      success: true,
      data: {
        station,
        currentTrains,
        upcomingArrivals,
        routes
      }
    });

  } catch (error) {
    logger.error('Get station error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get station by code
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const station = await Station.findByCode(code.toUpperCase());
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get additional station data
    const currentTrains = await station.getCurrentTrains();
    const upcomingArrivals = await station.getUpcomingArrivals();
    const routes = await station.getRoutes();

    res.json({
      success: true,
      data: {
        station,
        currentTrains,
        upcomingArrivals,
        routes
      }
    });

  } catch (error) {
    logger.error('Get station by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get station arrivals/departures
router.get('/:id/schedule', [
  query('date').optional().isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const { id } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get scheduled arrivals and departures
    const result = await require('../config/database').query(
      `SELECT 
        t.id, t.number, t.name, t.type, t.status,
        rs.arrival_time, rs.departure_time, rs.platform,
        r.name as route_name,
        p.predicted_time, p.confidence_score, p.delay_minutes
       FROM route_stations rs
       JOIN routes r ON rs.route_id = r.id
       JOIN trains t ON r.id = t.route_id
       LEFT JOIN predictions p ON t.id = p.train_id AND rs.station_id = p.station_id
       WHERE rs.station_id = $1
       AND (p.created_at IS NULL OR DATE(p.created_at) = $2)
       ORDER BY rs.arrival_time`,
      [id, date]
    );

    const schedule = result.rows;

    res.json({
      success: true,
      data: {
        station,
        schedule,
        date,
        count: schedule.length
      }
    });

  } catch (error) {
    logger.error('Get station schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get nearby stations
router.get('/:id/nearby', [
  query('radius').optional().isFloat({ min: 1, max: 100 }).withMessage('Radius must be between 1-100 km')
], async (req, res) => {
  try {
    const { id } = req.params;
    const radius = parseFloat(req.query.radius) || 50; // Default 50km radius

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const allStations = await Station.findAll();
    const nearbyStations = allStations
      .filter(s => s.id !== station.id)
      .map(s => ({
        ...s,
        distance: station.calculateDistance(s)
      }))
      .filter(s => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        station,
        nearbyStations,
        radius,
        count: nearbyStations.length
      }
    });

  } catch (error) {
    logger.error('Get nearby stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get station statistics
router.get('/:id/stats', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1-365')
], async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days) || 30;

    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get station statistics
    const statsResult = await require('../config/database').query(
      `SELECT 
        COUNT(DISTINCT td.train_id) as unique_trains,
        COUNT(*) as total_visits,
        AVG(td.speed) as avg_speed,
        COUNT(CASE WHEN p.delay_minutes > 5 THEN 1 END) as delayed_arrivals,
        COUNT(CASE WHEN p.delay_minutes <= 5 THEN 1 END) as on_time_arrivals
       FROM tracking_data td
       LEFT JOIN predictions p ON td.train_id = p.train_id AND td.station_id = p.station_id
       WHERE td.station_id = $1 
       AND td.timestamp > NOW() - INTERVAL '${days} days'`,
      [id]
    );

    const stats = statsResult.rows[0];
    const onTimePercentage = stats.total_visits > 0 
      ? (stats.on_time_arrivals / (stats.on_time_arrivals + stats.delayed_arrivals)) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        station,
        statistics: {
          ...stats,
          on_time_percentage: Math.round(onTimePercentage * 100) / 100,
          period_days: days
        }
      }
    });

  } catch (error) {
    logger.error('Get station stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
