const { query } = require('../config/database');

class Train {
  constructor(trainData) {
    this.id = trainData.id;
    this.number = trainData.number;
    this.name = trainData.name;
    this.type = trainData.type;
    this.capacity = trainData.capacity;
    this.status = trainData.status;
    this.currentStationId = trainData.current_station_id;
    this.routeId = trainData.route_id;
    this.createdAt = trainData.created_at;
    this.updatedAt = trainData.updated_at;
  }

  // Get all trains
  static async findAll() {
    const result = await query(
      `SELECT t.*, s.name as current_station_name, r.name as route_name
       FROM trains t
       LEFT JOIN stations s ON t.current_station_id = s.id
       LEFT JOIN routes r ON t.route_id = r.id
       ORDER BY t.number`
    );

    return result.rows.map(row => new Train(row));
  }

  // Find train by ID
  static async findById(id) {
    const result = await query(
      `SELECT t.*, s.name as current_station_name, r.name as route_name
       FROM trains t
       LEFT JOIN stations s ON t.current_station_id = s.id
       LEFT JOIN routes r ON t.route_id = r.id
       WHERE t.id = $1`,
      [id]
    );

    return result.rows.length > 0 ? new Train(result.rows[0]) : null;
  }

  // Find train by number
  static async findByNumber(number) {
    const result = await query(
      `SELECT t.*, s.name as current_station_name, r.name as route_name
       FROM trains t
       LEFT JOIN stations s ON t.current_station_id = s.id
       LEFT JOIN routes r ON t.route_id = r.id
       WHERE t.number = $1`,
      [number]
    );

    return result.rows.length > 0 ? new Train(result.rows[0]) : null;
  }

  // Search trains
  static async search(searchParams) {
    const { fromStation, toStation, date, trainType } = searchParams;

    // If no specific stations provided, return all trains
    if (!fromStation && !toStation) {
      let queryText = `
        SELECT DISTINCT t.*, s.name as current_station_name, r.name as route_name
        FROM trains t
        LEFT JOIN stations s ON t.current_station_id = s.id
        LEFT JOIN routes r ON t.route_id = r.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (trainType) {
        paramCount++;
        queryText += ` AND t.type = $${paramCount}`;
        params.push(trainType);
      }

      queryText += ` ORDER BY t.number`;
      const result = await query(queryText, params);
      return result.rows.map(row => new Train(row));
    }

    // Search for trains that serve both stations
    let queryText = `
      SELECT DISTINCT t.*, s.name as current_station_name, r.name as route_name,
             rs1.departure_time as departure_time,
             rs2.arrival_time as arrival_time,
             st1.name as from_station_name,
             st2.name as to_station_name
      FROM trains t
      LEFT JOIN stations s ON t.current_station_id = s.id
      LEFT JOIN routes r ON t.route_id = r.id
      LEFT JOIN route_stations rs1 ON r.id = rs1.route_id
      LEFT JOIN route_stations rs2 ON r.id = rs2.route_id
      LEFT JOIN stations st1 ON rs1.station_id = st1.id
      LEFT JOIN stations st2 ON rs2.station_id = st2.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (fromStation) {
      paramCount++;
      queryText += ` AND st1.name ILIKE $${paramCount}`;
      params.push(`%${fromStation}%`);
    }

    if (toStation) {
      paramCount++;
      queryText += ` AND st2.name ILIKE $${paramCount}`;
      params.push(`%${toStation}%`);
    }

    if (trainType) {
      paramCount++;
      queryText += ` AND t.type = $${paramCount}`;
      params.push(trainType);
    }

    // Ensure the from station comes before the to station in the route
    if (fromStation && toStation) {
      queryText += ` AND rs1.order_index < rs2.order_index`;
    }

    queryText += ` ORDER BY rs1.departure_time, t.number`;

    const result = await query(queryText, params);
    return result.rows.map(row => new Train(row));
  }

  // Get train schedule
  async getSchedule() {
    const result = await query(
      `SELECT rs.*, s.name as station_name, s.code as station_code
       FROM route_stations rs
       JOIN stations s ON rs.station_id = s.id
       WHERE rs.route_id = $1
       ORDER BY rs.order_index`,
      [this.routeId]
    );

    return result.rows;
  }

  // Get current location
  async getCurrentLocation() {
    const result = await query(
      `SELECT td.*, s.name as station_name
       FROM tracking_data td
       LEFT JOIN stations s ON td.station_id = s.id
       WHERE td.train_id = $1
       ORDER BY td.timestamp DESC
       LIMIT 1`,
      [this.id]
    );

    return result.rows[0] || null;
  }

  // Update train status
  async updateStatus(status, currentStationId = null) {
    const params = [status, this.id];
    let queryText = 'UPDATE trains SET status = $1, updated_at = NOW()';

    if (currentStationId) {
      queryText += ', current_station_id = $3';
      params.push(currentStationId);
    }

    queryText += ' WHERE id = $2 RETURNING *';

    const result = await query(queryText, params);
    return new Train(result.rows[0]);
  }

  // Get train predictions
  async getPredictions() {
    const result = await query(
      `SELECT p.*, s.name as station_name
       FROM predictions p
       JOIN stations s ON p.station_id = s.id
       WHERE p.train_id = $1 AND p.predicted_time > NOW()
       ORDER BY p.predicted_time`,
      [this.id]
    );

    return result.rows;
  }

  // Create new train
  static async create(trainData) {
    const { number, name, type, capacity, routeId } = trainData;

    const result = await query(
      `INSERT INTO trains (number, name, type, capacity, route_id, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING *`,
      [number, name, type, capacity, routeId]
    );

    return new Train(result.rows[0]);
  }
}

module.exports = Train;
