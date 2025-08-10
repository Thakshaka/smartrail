const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Mock alerts data - in a real app, this would come from a database
const mockAlerts = [
  {
    id: 1,
    type: 'delay',
    severity: 'warning',
    title: 'Train Delay',
    message: 'Udarata Menike (Train #1001) is delayed by 15 minutes due to signal issues.',
    trainId: 1,
    stationId: 3,
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    isActive: true
  },
  {
    id: 2,
    type: 'cancellation',
    severity: 'error',
    title: 'Service Cancellation',
    message: 'Evening Express (Train #1015) service has been cancelled due to technical issues.',
    trainId: 3,
    stationId: null,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    isActive: true
  },
  {
    id: 3,
    type: 'platform_change',
    severity: 'info',
    title: 'Platform Change',
    message: 'Podi Menike (Train #1005) will depart from Platform 3 instead of Platform 2.',
    trainId: 2,
    stationId: 1,
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    isRead: true,
    isActive: true
  },
  {
    id: 4,
    type: 'service_update',
    severity: 'info',
    title: 'Service Update',
    message: 'Additional coaches have been added to Intercity Express due to high demand.',
    trainId: 4,
    stationId: null,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true,
    isActive: true
  },
  {
    id: 5,
    type: 'weather',
    severity: 'warning',
    title: 'Weather Alert',
    message: 'Heavy rainfall expected in the hill country. Train services may experience delays.',
    trainId: null,
    stationId: null,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isRead: false,
    isActive: true
  }
];

// Get all alerts
router.get('/', auth, async (req, res) => {
  try {
    const { type, severity, limit = 50 } = req.query;
    
    let alerts = [...mockAlerts];
    
    // Filter by type
    if (type && type !== 'all') {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // Filter by severity
    if (severity && severity !== 'all') {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit results
    alerts = alerts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        unreadCount: alerts.filter(alert => !alert.isRead).length
      }
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
    const alert = mockAlerts.find(a => a.id === parseInt(id));
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.json({
      success: true,
      data: { alert }
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
    const alert = mockAlerts.find(a => a.id === parseInt(id));
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    alert.isRead = true;
    
    res.json({
      success: true,
      data: { alert },
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
    mockAlerts.forEach(alert => {
      alert.isRead = true;
    });
    
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
    const alertIndex = mockAlerts.findIndex(a => a.id === parseInt(id));
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    mockAlerts[alertIndex].isActive = false;
    
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
