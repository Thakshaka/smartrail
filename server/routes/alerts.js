const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// Get all alerts for regular users

router.get('/', auth, async (req, res) => {
  try {
    const { type, severity, limit = 50 } = req.query;

    const options = { limit: parseInt(limit) };
    if (type) options.type = type;
    if (severity) options.severity = severity;

    const result = await Alert.findForUsers(options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get alert by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: { alert: alert.toJSON() }
    });

  } catch (error) {
    logger.error('Get alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark alert as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.markAsRead(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: { alert: alert.toJSON() },
      message: 'Alert marked as read'
    });

  } catch (error) {
    logger.error('Mark alert read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all alerts as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    await Alert.markAllAsRead();

    res.json({
      success: true,
      message: 'All alerts marked as read'
    });

  } catch (error) {
    logger.error('Mark all alerts read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dismiss alert
router.delete('/:id', auth, async (req, res) => {
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
      message: 'Alert dismissed'
    });

  } catch (error) {
    logger.error('Dismiss alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
