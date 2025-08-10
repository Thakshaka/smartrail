const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.phone = userData.phone;
    this.dateOfBirth = userData.date_of_birth;
    this.role = userData.role || 'user'; // Default to 'user', can be 'admin'
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { email, password, firstName, lastName, phone, dateOfBirth, role = 'user' } = userData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, date_of_birth, role, created_at`,
      [email, hashedPassword, firstName, lastName, phone, dateOfBirth, role]
    );

    return new User(result.rows[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Generate JWT token
  generateToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        role: this.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }

  // Update user profile
  async update(updateData) {
    const { firstName, lastName, phone, dateOfBirth } = updateData;
    
    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, date_of_birth, updated_at`,
      [firstName, lastName, phone, dateOfBirth, this.id]
    );
    
    return new User(result.rows[0]);
  }

  // Change password
  async changePassword(newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, this.id]
    );
  }

  // Get user's bookings
  async getBookings() {
    const result = await query(
      `SELECT b.*, t.name as train_name, t.number as train_number,
              s1.name as from_station, s2.name as to_station
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.from_station_id = s1.id
       JOIN stations s2 ON b.to_station_id = s2.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [this.id]
    );
    
    return result.rows;
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
