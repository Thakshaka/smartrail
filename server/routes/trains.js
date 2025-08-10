const express = require('express');
const { query } = require('express-validator');
const Train = require('../models/Train');
const Station = require('../models/Station');
const logger = require('../utils/logger');

const router = express.Router();

// Get all trains
router.get('/', async (req, res) => {
  try {
    const trains = await Train.findAll();

    res.json({
      success: true,
      data: {
        trains,
        count: trains.length
      }
    });

  } catch (error) {
    logger.error('Get trains error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search trains
router.get('/search', [
  query('from').optional().trim(),
  query('to').optional().trim(),
  query('date').optional().isISO8601(),
  query('type').optional().trim()
], async (req, res) => {
  try {
    const { from, to, date, type } = req.query;

    const trains = await Train.search({
      fromStation: from,
      toStation: to,
      date,
      trainType: type
    });

    // Get additional details for each train
    const trainsWithDetails = await Promise.all(
      trains.map(async (train) => {
        const schedule = await train.getSchedule();
        const currentLocation = await train.getCurrentLocation();

        return {
          ...train,
          schedule,
          currentLocation
        };
      })
    );

    res.json({
      success: true,
      data: {
        trains: trainsWithDetails,
        count: trainsWithDetails.length,
        searchParams: { from, to, date, type }
      }
    });

  } catch (error) {
    logger.error('Train search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific train by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const train = await Train.findById(id);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Get additional train details
    const schedule = await train.getSchedule();
    const currentLocation = await train.getCurrentLocation();
    const predictions = await train.getPredictions();

    res.json({
      success: true,
      data: {
        train: {
          ...train,
          schedule,
          currentLocation,
          predictions
        }
      }
    });

  } catch (error) {
    logger.error('Get train error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get train by number
router.get('/number/:number', async (req, res) => {
  try {
    const { number } = req.params;

    const train = await Train.findByNumber(number);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Get additional train details
    const schedule = await train.getSchedule();
    const currentLocation = await train.getCurrentLocation();
    const predictions = await train.getPredictions();

    res.json({
      success: true,
      data: {
        train: {
          ...train,
          schedule,
          currentLocation,
          predictions
        }
      }
    });

  } catch (error) {
    logger.error('Get train by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get train schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;

    const train = await Train.findById(id);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    const schedule = await train.getSchedule();

    res.json({
      success: true,
      data: {
        trainId: id,
        schedule
      }
    });

  } catch (error) {
    logger.error('Get train schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available routes between stations
router.get('/routes/:fromStationId/:toStationId', async (req, res) => {
  try {
    const { fromStationId, toStationId } = req.params;
    const { date } = req.query;

    // Find trains that travel between these stations
    const result = await require('../config/database').query(
      `SELECT DISTINCT t.*, r.name as route_name,
              rs1.departure_time as from_departure_time,
              rs2.arrival_time as to_arrival_time,
              rs1.order_index as from_order,
              rs2.order_index as to_order
       FROM trains t
       JOIN routes r ON t.route_id = r.id
       JOIN route_stations rs1 ON r.id = rs1.route_id AND rs1.station_id = $1
       JOIN route_stations rs2 ON r.id = rs2.route_id AND rs2.station_id = $2
       WHERE rs1.order_index < rs2.order_index
       ORDER BY rs1.departure_time`,
      [fromStationId, toStationId]
    );

    const routes = result.rows.map(row => ({
      train: new Train(row),
      departureTime: row.from_departure_time,
      arrivalTime: row.to_arrival_time,
      duration: calculateDuration(row.from_departure_time, row.to_arrival_time)
    }));

    res.json({
      success: true,
      data: {
        routes,
        count: routes.length,
        fromStationId,
        toStationId,
        date
      }
    });

  } catch (error) {
    logger.error('Get routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate duration
function calculateDuration(departureTime, arrivalTime) {
  const departure = new Date(`1970-01-01T${departureTime}`);
  const arrival = new Date(`1970-01-01T${arrivalTime}`);

  let duration = arrival - departure;

  // Handle overnight journeys
  if (duration < 0) {
    duration += 24 * 60 * 60 * 1000; // Add 24 hours
  }

  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

// Temporary endpoint to fix route data
router.post('/fix-routes', async (req, res) => {
  try {
    const { query } = require('../config/database');

    // Get route and station IDs
    const mainLineResult = await query('SELECT id FROM routes WHERE name = $1', ['Main Line']);
    const routeId = mainLineResult.rows[0]?.id;

    const colomboResult = await query('SELECT id FROM stations WHERE name ILIKE $1', ['%Colombo%']);
    const kandyResult = await query('SELECT id FROM stations WHERE name ILIKE $1', ['%Kandy%']);

    const colomboId = colomboResult.rows[0]?.id;
    const kandyId = kandyResult.rows[0]?.id;

    if (routeId && colomboId && kandyId) {
      // Clear existing route stations
      await query('DELETE FROM route_stations WHERE route_id = $1', [routeId]);

      // Add route stations for both directions
      await query(`
        INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
        VALUES
        ($1, $2, 1, NULL, '06:00:00'),
        ($1, $3, 2, '09:30:00', '09:45:00'),
        ($1, $2, 3, '13:00:00', NULL)
      `, [routeId, colomboId, kandyId]);

      res.json({
        success: true,
        message: 'Route stations fixed successfully',
        data: {
          routeId,
          colomboId,
          kandyId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Could not find required route or stations'
      });
    }

  } catch (error) {
    logger.error('Fix routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
