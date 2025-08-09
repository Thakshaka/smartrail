const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartrail_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

// Sample data for Sri Lankan railway system
const stations = [
  { name: 'Colombo Fort', code: 'CMB', city: 'Colombo', province: 'Western', lat: 6.9344, lon: 79.8428, platforms: 8 },
  { name: 'Maradana', code: 'MDA', city: 'Colombo', province: 'Western', lat: 6.9292, lon: 79.8606, platforms: 4 },
  { name: 'Ragama', code: 'RGM', city: 'Gampaha', province: 'Western', lat: 7.0275, lon: 79.9167, platforms: 3 },
  { name: 'Gampaha', code: 'GPH', city: 'Gampaha', province: 'Western', lat: 7.0917, lon: 79.9944, platforms: 2 },
  { name: 'Veyangoda', code: 'VYA', city: 'Gampaha', province: 'Western', lat: 7.1583, lon: 80.0833, platforms: 2 },
  { name: 'Mirigama', code: 'MIG', city: 'Gampaha', province: 'Western', lat: 7.2417, lon: 80.1167, platforms: 2 },
  { name: 'Polgahawela', code: 'PGH', city: 'Kurunegala', province: 'North Western', lat: 7.3333, lon: 80.2, platforms: 3 },
  { name: 'Kurunegala', code: 'KUR', city: 'Kurunegala', province: 'North Western', lat: 7.4833, lon: 80.3667, platforms: 4 },
  { name: 'Kandy', code: 'KDY', city: 'Kandy', province: 'Central', lat: 7.2906, lon: 80.6337, platforms: 6 },
  { name: 'Peradeniya', code: 'PDN', city: 'Kandy', province: 'Central', lat: 7.2569, lon: 80.5981, platforms: 2 },
  { name: 'Gampola', code: 'GPL', city: 'Kandy', province: 'Central', lat: 7.1644, lon: 80.5736, platforms: 2 },
  { name: 'Nanu Oya', code: 'NNO', city: 'Nuwara Eliya', province: 'Central', lat: 6.9489, lon: 80.7678, platforms: 2 },
  { name: 'Ella', code: 'ELA', city: 'Badulla', province: 'Uva', lat: 6.8667, lon: 81.05, platforms: 1 },
  { name: 'Badulla', code: 'BDL', city: 'Badulla', province: 'Uva', lat: 6.9833, lon: 81.0667, platforms: 3 },
  { name: 'Galle', code: 'GLE', city: 'Galle', province: 'Southern', lat: 6.0535, lon: 80.221, platforms: 4 },
  { name: 'Matara', code: 'MTR', city: 'Matara', province: 'Southern', lat: 5.9549, lon: 80.5550, platforms: 3 }
];

const routes = [
  { name: 'Main Line', description: 'Colombo to Badulla via Kandy', distance: 290.8 },
  { name: 'Coastal Line', description: 'Colombo to Matara via Galle', distance: 159.5 },
  { name: 'Northern Line', description: 'Colombo to Jaffna', distance: 398.0 },
  { name: 'Puttalam Line', description: 'Colombo to Puttalam', distance: 145.0 }
];

const trains = [
  { number: '1001', name: 'Udarata Menike', type: 'express', capacity: 800, route: 'Main Line' },
  { number: '1005', name: 'Podi Menike', type: 'express', capacity: 600, route: 'Main Line' },
  { number: '1015', name: 'Upcountry Express', type: 'express', capacity: 700, route: 'Main Line' },
  { number: '8051', name: 'Ruhunu Kumari', type: 'intercity', capacity: 500, route: 'Coastal Line' },
  { number: '8055', name: 'Galu Kumari', type: 'express', capacity: 600, route: 'Coastal Line' },
  { number: '4075', name: 'Yal Devi', type: 'intercity', capacity: 750, route: 'Northern Line' }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const stationCount = await client.query('SELECT COUNT(*) FROM stations');
    if (parseInt(stationCount.rows[0].count) > 0) {
      console.log('📊 Database already contains data. Skipping seed.');
      return;
    }
    
    await client.query('BEGIN');
    
    // Seed stations
    console.log('📍 Seeding stations...');
    for (const station of stations) {
      await client.query(
        `INSERT INTO stations (name, code, city, province, latitude, longitude, platforms, facilities)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          station.name, station.code, station.city, station.province,
          station.lat, station.lon, station.platforms,
          JSON.stringify(['waiting_room', 'restrooms', 'parking'])
        ]
      );
    }
    
    // Seed routes
    console.log('🛤️  Seeding routes...');
    for (const route of routes) {
      await client.query(
        `INSERT INTO routes (name, description, distance_km, estimated_duration)
         VALUES ($1, $2, $3, $4)`,
        [route.name, route.description, route.distance, '06:00:00']
      );
    }
    
    // Seed trains
    console.log('🚂 Seeding trains...');
    for (const train of trains) {
      const routeResult = await client.query('SELECT id FROM routes WHERE name = $1', [train.route]);
      const routeId = routeResult.rows[0]?.id;
      
      if (routeId) {
        await client.query(
          `INSERT INTO trains (number, name, type, capacity, route_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [train.number, train.name, train.type, train.capacity, routeId]
        );
      }
    }
    
    // Seed route stations for Main Line
    console.log('🗺️  Seeding route stations...');
    const mainLineRoute = await client.query('SELECT id FROM routes WHERE name = $1', ['Main Line']);
    const mainLineId = mainLineRoute.rows[0]?.id;
    
    if (mainLineId) {
      const mainLineStations = [
        { station: 'CMB', order: 1, arrival: null, departure: '06:00:00' },
        { station: 'MDA', order: 2, arrival: '06:05:00', departure: '06:07:00' },
        { station: 'RGM', order: 3, arrival: '06:25:00', departure: '06:27:00' },
        { station: 'GPH', order: 4, arrival: '06:40:00', departure: '06:42:00' },
        { station: 'VYA', order: 5, arrival: '06:55:00', departure: '06:57:00' },
        { station: 'MIG', order: 6, arrival: '07:10:00', departure: '07:12:00' },
        { station: 'PGH', order: 7, arrival: '07:30:00', departure: '07:35:00' },
        { station: 'KUR', order: 8, arrival: '08:00:00', departure: '08:05:00' },
        { station: 'KDY', order: 9, arrival: '09:30:00', departure: '09:40:00' },
        { station: 'PDN', order: 10, arrival: '09:55:00', departure: '09:57:00' },
        { station: 'GPL', order: 11, arrival: '10:15:00', departure: '10:17:00' },
        { station: 'NNO', order: 12, arrival: '11:30:00', departure: '11:35:00' },
        { station: 'ELA', order: 13, arrival: '12:45:00', departure: '12:50:00' },
        { station: 'BDL', order: 14, arrival: '13:30:00', departure: null }
      ];
      
      for (const routeStation of mainLineStations) {
        const stationResult = await client.query('SELECT id FROM stations WHERE code = $1', [routeStation.station]);
        const stationId = stationResult.rows[0]?.id;
        
        if (stationId) {
          await client.query(
            `INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
             VALUES ($1, $2, $3, $4, $5)`,
            [mainLineId, stationId, routeStation.order, routeStation.arrival, routeStation.departure]
          );
        }
      }
    }
    
    // Seed route stations for Coastal Line
    const coastalLineRoute = await client.query('SELECT id FROM routes WHERE name = $1', ['Coastal Line']);
    const coastalLineId = coastalLineRoute.rows[0]?.id;
    
    if (coastalLineId) {
      const coastalStations = [
        { station: 'CMB', order: 1, arrival: null, departure: '07:00:00' },
        { station: 'MDA', order: 2, arrival: '07:05:00', departure: '07:07:00' },
        { station: 'GLE', order: 3, arrival: '09:30:00', departure: '09:35:00' },
        { station: 'MTR', order: 4, arrival: '10:45:00', departure: null }
      ];
      
      for (const routeStation of coastalStations) {
        const stationResult = await client.query('SELECT id FROM stations WHERE code = $1', [routeStation.station]);
        const stationId = stationResult.rows[0]?.id;
        
        if (stationId) {
          await client.query(
            `INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
             VALUES ($1, $2, $3, $4, $5)`,
            [coastalLineId, stationId, routeStation.order, routeStation.arrival, routeStation.departure]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
