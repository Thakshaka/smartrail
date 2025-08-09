const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartrail_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
  },
  {
    name: '002_create_stations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        city VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        platforms INTEGER DEFAULT 1,
        facilities JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(code);
      CREATE INDEX IF NOT EXISTS idx_stations_city ON stations(city);
    `
  },
  {
    name: '003_create_routes_table',
    sql: `
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        distance_km DECIMAL(8, 2),
        estimated_duration INTERVAL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: '004_create_route_stations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS route_stations (
        id SERIAL PRIMARY KEY,
        route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
        station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        arrival_time TIME,
        departure_time TIME,
        platform VARCHAR(10),
        stop_duration INTERVAL DEFAULT '00:02:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_route_stations_unique 
      ON route_stations(route_id, station_id);
      
      CREATE INDEX IF NOT EXISTS idx_route_stations_order 
      ON route_stations(route_id, order_index);
    `
  },
  {
    name: '005_create_trains_table',
    sql: `
      CREATE TABLE IF NOT EXISTS trains (
        id SERIAL PRIMARY KEY,
        number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'express', 'intercity', 'local', 'night_mail'
        capacity INTEGER NOT NULL,
        current_station_id INTEGER REFERENCES stations(id),
        route_id INTEGER REFERENCES routes(id),
        status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'running', 'delayed', 'cancelled', 'completed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(number);
      CREATE INDEX IF NOT EXISTS idx_trains_status ON trains(status);
      CREATE INDEX IF NOT EXISTS idx_trains_route ON trains(route_id);
    `
  },
  {
    name: '006_create_bookings_table',
    sql: `
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(20) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        train_id INTEGER REFERENCES trains(id),
        from_station_id INTEGER REFERENCES stations(id),
        to_station_id INTEGER REFERENCES stations(id),
        travel_date DATE NOT NULL,
        departure_time TIME NOT NULL,
        arrival_time TIME NOT NULL,
        passengers JSONB NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
        booking_status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
        seat_numbers JSONB,
        class_type VARCHAR(20) NOT NULL, -- 'first', 'second', 'third'
        payment_details JSONB,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_train ON bookings(train_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date);
    `
  },
  {
    name: '007_create_tracking_data_table',
    sql: `
      CREATE TABLE IF NOT EXISTS tracking_data (
        id SERIAL PRIMARY KEY,
        train_id INTEGER REFERENCES trains(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        speed DECIMAL(5, 2), -- km/h
        heading DECIMAL(5, 2), -- degrees
        station_id INTEGER REFERENCES stations(id),
        arrival_time TIMESTAMP,
        departure_time TIMESTAMP,
        platform VARCHAR(10),
        estimated_arrival TIME,
        accuracy DECIMAL(5, 2), -- meters
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_tracking_train_time ON tracking_data(train_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_tracking_station ON tracking_data(station_id);
      CREATE INDEX IF NOT EXISTS idx_tracking_timestamp ON tracking_data(timestamp);
    `
  },
  {
    name: '008_create_predictions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        train_id INTEGER REFERENCES trains(id) ON DELETE CASCADE,
        station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
        predicted_time TIME NOT NULL,
        confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
        delay_minutes INTEGER DEFAULT 0,
        prediction_method VARCHAR(50), -- 'ml_model', 'schedule_based', 'hybrid'
        factors JSONB, -- factors affecting prediction
        actual_arrival_time TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE UNIQUE INDEX IF NOT EXISTS idx_predictions_unique 
      ON predictions(train_id, station_id, DATE(created_at));
      
      CREATE INDEX IF NOT EXISTS idx_predictions_train ON predictions(train_id);
      CREATE INDEX IF NOT EXISTS idx_predictions_station ON predictions(station_id);
    `
  }
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  Starting database migrations...');
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get already executed migrations
    const executedResult = await client.query('SELECT name FROM migrations');
    const executedMigrations = executedResult.rows.map(row => row.name);
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.name)) {
        console.log(`📝 Running migration: ${migration.name}`);
        
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
          await client.query('COMMIT');
          console.log(`✅ Migration completed: ${migration.name}`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`⏭️  Migration already executed: ${migration.name}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
