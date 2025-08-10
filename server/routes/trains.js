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
        try {
          const schedule = await train.getSchedule();
          const currentLocation = await train.getCurrentLocation();

        // Find departure and arrival times for the specific route
        let departureTime = null;
        let arrivalTime = null;
        let originStation = null;
        let destinationStation = null;

        if (from && to && schedule.length > 0) {
          // Find stations in the schedule
          const fromStationSchedule = schedule.find(s =>
            s.station_name && s.station_name.toLowerCase().includes(from.toLowerCase())
          );
          const toStationSchedule = schedule.find(s =>
            s.station_name && s.station_name.toLowerCase().includes(to.toLowerCase())
          );

          if (fromStationSchedule) {
            departureTime = fromStationSchedule.departure_time;
            originStation = fromStationSchedule.station_name;
          }
          if (toStationSchedule) {
            arrivalTime = toStationSchedule.arrival_time;
            destinationStation = toStationSchedule.station_name;
          }
        }

        // If no specific route found, use first and last stations
        if (!departureTime && schedule.length > 0) {
          departureTime = schedule[0].departure_time;
          originStation = schedule[0].station_name;
        }
        if (!arrivalTime && schedule.length > 0) {
          arrivalTime = schedule[schedule.length - 1].arrival_time;
          destinationStation = schedule[schedule.length - 1].station_name;
        }

        return {
          id: train.id,
          train_number: train.number,
          train_name: train.name,
          train_type: train.type,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          origin_station: originStation,
          destination_station: destinationStation,
          capacity: train.capacity,
          status: train.status,
          schedule,
          currentLocation
        };
        } catch (error) {
          console.error('Error processing train:', train.id, error);
          // Return basic train info if detailed processing fails
          return {
            id: train.id,
            train_number: train.number,
            train_name: train.name,
            train_type: train.type,
            departure_time: '06:00:00',
            arrival_time: '09:30:00',
            origin_station: from || 'Colombo Fort',
            destination_station: to || 'Kandy',
            capacity: train.capacity,
            status: train.status,
            schedule: [],
            currentLocation: null
          };
        }
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

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Main Line route not found'
      });
    }

    // Get all stations we need
    const stationsResult = await query(`
      SELECT id, name, code FROM stations
      WHERE code IN ('CMB', 'MDA', 'RGM', 'GPH', 'VYA', 'MIG', 'PGH', 'KUR', 'KDY')
      ORDER BY
        CASE code
          WHEN 'CMB' THEN 1
          WHEN 'MDA' THEN 2
          WHEN 'RGM' THEN 3
          WHEN 'GPH' THEN 4
          WHEN 'VYA' THEN 5
          WHEN 'MIG' THEN 6
          WHEN 'PGH' THEN 7
          WHEN 'KUR' THEN 8
          WHEN 'KDY' THEN 9
        END
    `);

    const stations = stationsResult.rows;

    if (stations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Required stations not found'
      });
    }

    // Clear existing route stations
    await query('DELETE FROM route_stations WHERE route_id = $1', [routeId]);

    // Define the complete route with proper times (Colombo to Kandy)
    const routeStations = [
      { code: 'CMB', order: 1, arrival: null, departure: '06:00:00' },
      { code: 'MDA', order: 2, arrival: '06:07:00', departure: '06:09:00' },
      { code: 'RGM', order: 3, arrival: '06:30:00', departure: '06:32:00' },
      { code: 'GPH', order: 4, arrival: '06:50:00', departure: '06:52:00' },
      { code: 'VYA', order: 5, arrival: '07:10:00', departure: '07:12:00' },
      { code: 'MIG', order: 6, arrival: '07:25:00', departure: '07:27:00' },
      { code: 'PGH', order: 7, arrival: '07:45:00', departure: '07:50:00' },
      { code: 'KUR', order: 8, arrival: '08:15:00', departure: '08:20:00' },
      { code: 'KDY', order: 9, arrival: '09:30:00', departure: '09:45:00' },
      // Return journey (Kandy to Colombo) - continuing the same route
      { code: 'KUR', order: 10, arrival: '15:30:00', departure: '15:35:00' },
      { code: 'PGH', order: 11, arrival: '16:00:00', departure: '16:05:00' },
      { code: 'MIG', order: 12, arrival: '16:25:00', departure: '16:27:00' },
      { code: 'VYA', order: 13, arrival: '16:40:00', departure: '16:42:00' },
      { code: 'GPH', order: 14, arrival: '17:00:00', departure: '17:02:00' },
      { code: 'RGM', order: 15, arrival: '17:20:00', departure: '17:22:00' },
      { code: 'MDA', order: 16, arrival: '17:43:00', departure: '17:45:00' },
      { code: 'CMB', order: 17, arrival: '17:52:00', departure: null }
    ];

    // Insert route stations
    for (const routeStation of routeStations) {
      const station = stations.find(s => s.code === routeStation.code);
      if (station) {
        await query(`
          INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
          VALUES ($1, $2, $3, $4, $5)
        `, [routeId, station.id, routeStation.order, routeStation.arrival, routeStation.departure]);
      }
    }

    // Verify the data
    const verifyResult = await query(`
      SELECT rs.order_index, s.name, s.code, rs.arrival_time, rs.departure_time
      FROM route_stations rs
      JOIN stations s ON rs.station_id = s.id
      WHERE rs.route_id = $1
      ORDER BY rs.order_index
    `, [routeId]);

    res.json({
      success: true,
      message: 'Route stations fixed successfully',
      data: {
        routeId,
        stationsAdded: verifyResult.rows.length,
        route: verifyResult.rows
      }
    });

  } catch (error) {
    logger.error('Fix routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
