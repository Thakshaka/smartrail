const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Booking {
  constructor(bookingData) {
    this.id = bookingData.id;
    this.bookingReference = bookingData.booking_reference;
    this.userId = bookingData.user_id;
    this.trainId = bookingData.train_id;
    this.fromStationId = bookingData.from_station_id;
    this.toStationId = bookingData.to_station_id;
    this.travelDate = bookingData.travel_date;
    this.departureTime = bookingData.departure_time;
    this.arrivalTime = bookingData.arrival_time;
    this.passengers = bookingData.passengers;
    this.totalAmount = bookingData.total_amount;
    this.paymentStatus = bookingData.payment_status;
    this.bookingStatus = bookingData.booking_status;
    this.seatNumbers = bookingData.seat_numbers;
    this.classType = bookingData.class_type;
    this.createdAt = bookingData.created_at;
    this.updatedAt = bookingData.updated_at;

    // Include joined fields for display
    this.trainName = bookingData.train_name;
    this.trainNumber = bookingData.train_number;
    this.fromStationName = bookingData.from_station_name;
    this.fromStationCode = bookingData.from_station_code;
    this.toStationName = bookingData.to_station_name;
    this.toStationCode = bookingData.to_station_code;
  }

  // Create new booking
  static async create(bookingData) {
    const {
      userId, trainId, fromStationId, toStationId, travelDate,
      departureTime, arrivalTime, passengers, totalAmount, classType
    } = bookingData;
    
    const bookingReference = this.generateBookingReference();
    
    const result = await query(
      `INSERT INTO bookings (
        booking_reference, user_id, train_id, from_station_id, to_station_id,
        travel_date, departure_time, arrival_time, passengers, total_amount,
        class_type, payment_status, booking_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'confirmed')
      RETURNING *`,
      [
        bookingReference, userId, trainId, fromStationId, toStationId,
        travelDate, departureTime, arrivalTime, JSON.stringify(passengers),
        totalAmount, classType
      ]
    );
    
    return new Booking(result.rows[0]);
  }

  // Generate unique booking reference
  static generateBookingReference() {
    const prefix = 'SR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Find booking by ID
  static async findById(id) {
    const result = await query(
      `SELECT b.*, 
              u.first_name, u.last_name, u.email,
              t.name as train_name, t.number as train_number,
              s1.name as from_station_name, s1.code as from_station_code,
              s2.name as to_station_name, s2.code as to_station_code
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.from_station_id = s1.id
       JOIN stations s2 ON b.to_station_id = s2.id
       WHERE b.id = $1`,
      [id]
    );
    
    return result.rows.length > 0 ? new Booking(result.rows[0]) : null;
  }

  // Find booking by reference
  static async findByReference(reference) {
    const result = await query(
      `SELECT b.*, 
              u.first_name, u.last_name, u.email,
              t.name as train_name, t.number as train_number,
              s1.name as from_station_name, s1.code as from_station_code,
              s2.name as to_station_name, s2.code as to_station_code
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.from_station_id = s1.id
       JOIN stations s2 ON b.to_station_id = s2.id
       WHERE b.booking_reference = $1`,
      [reference]
    );
    
    return result.rows.length > 0 ? new Booking(result.rows[0]) : null;
  }

  // Get user bookings
  static async findByUserId(userId) {
    const result = await query(
      `SELECT b.*, 
              t.name as train_name, t.number as train_number,
              s1.name as from_station_name, s1.code as from_station_code,
              s2.name as to_station_name, s2.code as to_station_code
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.from_station_id = s1.id
       JOIN stations s2 ON b.to_station_id = s2.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => new Booking(row));
  }

  // Update payment status
  async updatePaymentStatus(status, paymentDetails = null) {
    const result = await query(
      `UPDATE bookings 
       SET payment_status = $1, payment_details = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, paymentDetails ? JSON.stringify(paymentDetails) : null, this.id]
    );
    
    return new Booking(result.rows[0]);
  }

  // Cancel booking
  async cancel(reason = null) {
    const result = await query(
      `UPDATE bookings 
       SET booking_status = 'cancelled', cancellation_reason = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason, this.id]
    );
    
    return new Booking(result.rows[0]);
  }

  // Assign seats
  async assignSeats(seatNumbers) {
    const result = await query(
      `UPDATE bookings 
       SET seat_numbers = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(seatNumbers), this.id]
    );
    
    return new Booking(result.rows[0]);
  }

  // Check if booking can be cancelled
  canBeCancelled() {
    const now = new Date();
    const travelDateTime = new Date(`${this.travelDate} ${this.departureTime}`);
    const hoursDifference = (travelDateTime - now) / (1000 * 60 * 60);
    
    return hoursDifference > 2 && this.bookingStatus === 'confirmed';
  }

  // Calculate refund amount
  calculateRefundAmount() {
    if (!this.canBeCancelled()) return 0;
    
    const now = new Date();
    const travelDateTime = new Date(`${this.travelDate} ${this.departureTime}`);
    const hoursDifference = (travelDateTime - now) / (1000 * 60 * 60);
    
    if (hoursDifference > 24) {
      return this.totalAmount * 0.9; // 90% refund
    } else if (hoursDifference > 12) {
      return this.totalAmount * 0.75; // 75% refund
    } else if (hoursDifference > 2) {
      return this.totalAmount * 0.5; // 50% refund
    }
    
    return 0;
  }
}

module.exports = Booking;
