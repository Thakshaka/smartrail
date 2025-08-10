const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const Station = require('../models/Station');
const auth = require('../middleware/auth');
const socketService = require('../services/socketService');
const logger = require('../utils/logger');

const router = express.Router();

// Create new booking
router.post('/', auth, [
  body('trainId').isInt().withMessage('Valid train ID is required'),
  body('fromStationId').isInt().withMessage('Valid from station ID is required'),
  body('toStationId').isInt().withMessage('Valid to station ID is required'),
  body('travelDate').isISO8601().withMessage('Valid travel date is required'),
  body('passengers').isArray({ min: 1 }).withMessage('At least one passenger is required'),
  body('classType').isIn(['first', 'second', 'third']).withMessage('Valid class type is required')
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

    const { trainId, fromStationId, toStationId, travelDate, passengers, classType } = req.body;

    // Validate train exists
    console.log('Looking for train with ID:', trainId);
    const train = await Train.findById(trainId);
    console.log('Found train:', train);
    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found'
      });
    }

    // Validate stations exist
    const fromStation = await Station.findById(fromStationId);
    const toStation = await Station.findById(toStationId);
    
    if (!fromStation || !toStation) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get route information
    console.log('Getting schedule for train:', train.id);
    const schedule = await train.getSchedule();
    console.log('Train schedule:', schedule);
    const fromStationSchedule = schedule.find(s => s.station_id == fromStationId);
    const toStationSchedule = schedule.find(s => s.station_id == toStationId);
    console.log('From station schedule:', fromStationSchedule);
    console.log('To station schedule:', toStationSchedule);

    if (!fromStationSchedule || !toStationSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Train does not travel between selected stations'
      });
    }

    // Calculate pricing based on class type
    let basePrice = 1500; // Default Second Class price
    switch (classType) {
      case 'first':
        basePrice = 2500;
        break;
      case 'second':
        basePrice = 1500;
        break;
      case 'third':
        basePrice = 800;
        break;
      default:
        basePrice = 1500;
    }
    const totalAmount = basePrice * passengers.length;

    // Create booking
    console.log('Creating booking with data:', {
      userId: req.user.id,
      trainId,
      fromStationId,
      toStationId,
      travelDate,
      departureTime: fromStationSchedule.departure_time,
      arrivalTime: toStationSchedule.arrival_time,
      passengers,
      totalAmount,
      classType
    });
    const booking = await Booking.create({
      userId: req.user.id,
      trainId,
      fromStationId,
      toStationId,
      travelDate,
      departureTime: fromStationSchedule.departure_time,
      arrivalTime: toStationSchedule.arrival_time,
      passengers,
      totalAmount,
      classType
    });
    console.log('Booking created:', booking);

    // Send booking confirmation via socket
    socketService.sendBookingUpdate(req.user.id, booking);

    logger.info(`New booking created: ${booking.bookingReference} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    logger.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.findByUserId(req.user.id);

    res.json({
      success: true,
      data: {
        bookings,
        count: bookings.length
      }
    });

  } catch (error) {
    logger.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get booking by reference
router.get('/reference/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const booking = await Booking.findByReference(reference);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    logger.error('Get booking by reference error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled (less than 2 hours before departure or already cancelled)'
      });
    }

    // Cancel booking
    const cancelledBooking = await booking.cancel(reason);
    
    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();

    // Send cancellation notification
    socketService.sendBookingUpdate(req.user.id, {
      ...cancelledBooking,
      refundAmount
    });

    logger.info(`Booking cancelled: ${booking.bookingReference} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: cancelledBooking,
        refundAmount
      }
    });

  } catch (error) {
    logger.error('Booking cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payment status
router.put('/:id/payment', auth, [
  body('status').isIn(['completed', 'failed']).withMessage('Valid payment status is required'),
  body('paymentDetails').optional().isObject()
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

    const { id } = req.params;
    const { status, paymentDetails } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update payment status
    const updatedBooking = await booking.updatePaymentStatus(status, paymentDetails);

    // Send payment update notification
    socketService.sendBookingUpdate(req.user.id, updatedBooking);

    logger.info(`Payment status updated: ${booking.bookingReference} - ${status}`);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { booking: updatedBooking }
    });

  } catch (error) {
    logger.error('Payment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to calculate pricing
function calculatePrice(classType, fromStation, toStation) {
  const basePrices = {
    'first': 15,
    'second': 10,
    'third': 6
  };

  const basePrice = basePrices[classType] || basePrices['third'];
  
  // Calculate distance factor (simplified)
  const orderDifference = Math.abs(toStation.order_index - fromStation.order_index);
  const distanceFactor = Math.max(1, orderDifference * 0.5);
  
  return Math.round(basePrice * distanceFactor);
}

module.exports = router;
