const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartrail_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('🗄️  Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query: ${text} | Duration: ${duration}ms | Rows: ${res.rowCount}`);
    return res;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info(`✅ Database connection successful. Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database connection
const initializeDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  initializeDatabase
};
