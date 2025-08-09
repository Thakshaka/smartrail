const { query } = require('../config/database');

class Station {
  constructor(stationData) {
    this.id = stationData.id;
    this.name = stationData.name;
    this.code = stationData.code;
    this.city = stationData.city;
    this.province = stationData.province;
    this.latitude = stationData.latitude;
    this.longitude = stationData.longitude;
    this.platforms = stationData.platforms;
    this.facilities = stationData.facilities;
    this.createdAt = stationData.created_at;
    this.updatedAt = stationData.updated_at;
  }

  // Get all stations
  static async findAll() {
    const result = await query(
      'SELECT * FROM stations ORDER BY name'
    );
    
    return result.rows.map(row => new Station(row));
  }

  // Find station by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM stations WHERE id = $1',
      [id]
    );
    
    return result.rows.length > 0 ? new Station(result.rows[0]) : null;
  }

  // Find station by code
  static async findByCode(code) {
    const result = await query(
      'SELECT * FROM stations WHERE code = $1',
      [code]
    );
    
    return result.rows.length > 0 ? new Station(result.rows[0]) : null;
  }

  // Search stations by name
  static async searchByName(name) {
    const result = await query(
      'SELECT * FROM stations WHERE name ILIKE $1 ORDER BY name',
      [`%${name}%`]
    );
    
    return result.rows.map(row => new Station(row));
  }

  // Get stations by city
  static async findByCity(city) {
    const result = await query(
      'SELECT * FROM stations WHERE city ILIKE $1 ORDER BY name',
      [`%${city}%`]
    );
    
    return result.rows.map(row => new Station(row));
  }

  // Get stations by province
  static async findByProvince(province) {
    const result = await query(
      'SELECT * FROM stations WHERE province ILIKE $1 ORDER BY name',
      [`%${province}%`]
    );
    
    return result.rows.map(row => new Station(row));
  }

  // Get current trains at station
  async getCurrentTrains() {
    const result = await query(
      `SELECT t.*, td.arrival_time, td.departure_time, td.platform
       FROM trains t
       JOIN tracking_data td ON t.id = td.train_id
       WHERE td.station_id = $1 AND td.departure_time IS NULL
       ORDER BY td.arrival_time`,
      [this.id]
    );
    
    return result.rows;
  }

  // Get upcoming arrivals
  async getUpcomingArrivals(limit = 10) {
    const result = await query(
      `SELECT t.*, p.predicted_time, p.confidence_score
       FROM predictions p
       JOIN trains t ON p.train_id = t.id
       WHERE p.station_id = $1 AND p.predicted_time > NOW()
       ORDER BY p.predicted_time
       LIMIT $2`,
      [this.id, limit]
    );
    
    return result.rows;
  }

  // Get station routes
  async getRoutes() {
    const result = await query(
      `SELECT DISTINCT r.*, rs.order_index
       FROM routes r
       JOIN route_stations rs ON r.id = rs.route_id
       WHERE rs.station_id = $1
       ORDER BY r.name`,
      [this.id]
    );
    
    return result.rows;
  }

  // Create new station
  static async create(stationData) {
    const { name, code, city, province, latitude, longitude, platforms, facilities } = stationData;
    
    const result = await query(
      `INSERT INTO stations (name, code, city, province, latitude, longitude, platforms, facilities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, code, city, province, latitude, longitude, platforms, JSON.stringify(facilities)]
    );
    
    return new Station(result.rows[0]);
  }

  // Update station
  async update(updateData) {
    const { name, city, province, latitude, longitude, platforms, facilities } = updateData;
    
    const result = await query(
      `UPDATE stations 
       SET name = $1, city = $2, province = $3, latitude = $4, longitude = $5, 
           platforms = $6, facilities = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, city, province, latitude, longitude, platforms, JSON.stringify(facilities), this.id]
    );
    
    return new Station(result.rows[0]);
  }

  // Calculate distance to another station
  calculateDistance(otherStation) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(otherStation.latitude - this.latitude);
    const dLon = this.toRadians(otherStation.longitude - this.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(otherStation.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }
}

module.exports = Station;
