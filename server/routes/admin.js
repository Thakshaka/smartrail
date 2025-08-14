const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { query } = require('../config/database');
const User = require('../models/User');
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// Get dashboard statistics
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    // Get various statistics
    const [
      usersResult,
      trainsResult,
      bookingsResult,
      revenueResult,
      activeTrainsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM trains'),
      query('SELECT COUNT(*) as count FROM bookings'),
      query('SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = $1', ['completed']),
      query('SELECT COUNT(*) as count FROM trains WHERE status = $1', ['active'])
    ]);

    // Get recent bookings
    const recentBookings = await query(`
      SELECT b.*, u.first_name, u.last_name, u.email, t.name as train_name, t.number as train_number
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN trains t ON b.train_id = t.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    // Get booking trends (last 7 days)
    const bookingTrends = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: parseInt(usersResult.rows[0].count),
          totalTrains: parseInt(trainsResult.rows[0].count),
          totalBookings: parseInt(bookingsResult.rows[0].count),
          totalRevenue: parseFloat(revenueResult.rows[0].total || 0),
          activeTrains: parseInt(activeTrainsResult.rows[0].count)
        },
        recentBookings: recentBookings.rows,
        bookingTrends: bookingTrends.rows
      }
    });

  } catch (error) {
    logger.error('Admin dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [limit, offset];

    if (search) {
      whereClause = `WHERE first_name ILIKE $3 OR last_name ILIKE $3 OR email ILIKE $3`;
      params.push(`%${search}%`);
    }

    const usersResult = await query(`
      SELECT id, email, first_name, last_name, phone, role, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `, search ? [`%${search}%`] : []);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, id]
    );

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    logger.error('Admin update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all trains with details
router.get('/trains', adminAuth, async (req, res) => {
  try {
    const trains = await Train.findAll();
    res.json({
      success: true,
      data: { trains }
    });

  } catch (error) {
    logger.error('Admin get trains error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update train status
router.patch('/trains/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'maintenance', 'scheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await query(
      'UPDATE trains SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Train status updated successfully'
    });

  } catch (error) {
    logger.error('Admin update train status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all bookings with details
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [limit, offset];

    if (status) {
      whereClause = 'WHERE b.booking_status = $3';
      params.push(status);
    }

    const bookingsResult = await query(`
      SELECT b.*, u.first_name, u.last_name, u.email, 
             t.name as train_name, t.number as train_number,
             s1.name as from_station_name, s2.name as to_station_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN trains t ON b.train_id = t.id
      JOIN stations s1 ON b.from_station_id = s1.id
      JOIN stations s2 ON b.to_station_id = s2.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM bookings b
      ${whereClause}
    `, status ? [status] : []);

    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Admin get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update booking status
router.patch('/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'cancelled', 'completed', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await query(
      'UPDATE bookings SET booking_status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully'
    });

  } catch (error) {
    logger.error('Admin update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Alert management endpoints
// Get all alerts for admin
router.get('/alerts', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = '', severity = '' } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (type) options.type = type;
    if (severity) options.severity = severity;

    const result = await Alert.findAll(options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Admin get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new alert
router.post('/alerts', adminAuth, async (req, res) => {
  try {
    const { type, severity, title, message, trainId, stationId } = req.body;

    // Validate required fields
    if (!type || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, severity, title, and message are required'
      });
    }

    const alertData = {
      type,
      severity,
      title,
      message,
      trainId: trainId || null,
      stationId: stationId || null
    };

    const newAlert = await Alert.create(alertData);

    res.status(201).json({
      success: true,
      data: { alert: newAlert.toJSON() },
      message: 'Alert created successfully'
    });

  } catch (error) {
    logger.error('Admin create alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update alert
router.put('/alerts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, severity, title, message, trainId, stationId, isActive } = req.body;

    // Validate required fields
    if (!type || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, severity, title, and message are required'
      });
    }

    const alertData = {
      type,
      severity,
      title,
      message,
      trainId: trainId || null,
      stationId: stationId || null,
      isActive: isActive !== undefined ? isActive : true
    };

    const updatedAlert = await Alert.update(id, alertData);

    if (!updatedAlert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: { alert: updatedAlert.toJSON() },
      message: 'Alert updated successfully'
    });

  } catch (error) {
    logger.error('Admin update alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete alert
router.delete('/alerts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Alert.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    logger.error('Admin delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Emergency admin promotion (for setup only)
router.post('/promote-user', async (req, res) => {
  try {
    const { email, secret } = req.body;

    // Simple secret check for security
    if (secret !== 'admin-setup-2024') {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret'
      });
    }

    await query(
      'UPDATE users SET role = $1 WHERE email = $2',
      ['admin', email]
    );

    res.json({
      success: true,
      message: 'User promoted to admin successfully'
    });

  } catch (error) {
    logger.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
