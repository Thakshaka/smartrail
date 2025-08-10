const { pool } = require('../config/database');

// Train schedules for Main Line (Colombo to Kandy)
const trainSchedules = [
  {
    trainNumber: '1001', // Udarata Menike
    schedules: [
      { station: 'CMB', arrival: null, departure: '05:55' },
      { station: 'MDA', arrival: '06:02', departure: '06:04' },
      { station: 'RGM', arrival: '06:25', departure: '06:27' },
      { station: 'GPH', arrival: '06:45', departure: '06:47' },
      { station: 'VYA', arrival: '07:05', departure: '07:07' },
      { station: 'MIG', arrival: '07:20', departure: '07:22' },
      { station: 'PLG', arrival: '07:35', departure: '07:37' },
      { station: 'AMB', arrival: '08:15', departure: '08:17' },
      { station: 'RMK', arrival: '08:45', departure: '08:47' },
      { station: 'KDT', arrival: '09:25', departure: null }
    ]
  },
  {
    trainNumber: '1005', // Podi Menike
    schedules: [
      { station: 'CMB', arrival: null, departure: '08:30' },
      { station: 'MDA', arrival: '08:37', departure: '08:39' },
      { station: 'RGM', arrival: '09:00', departure: '09:02' },
      { station: 'GPH', arrival: '09:20', departure: '09:22' },
      { station: 'VYA', arrival: '09:40', departure: '09:42' },
      { station: 'MIG', arrival: '09:55', departure: '09:57' },
      { station: 'PLG', arrival: '10:10', departure: '10:12' },
      { station: 'AMB', arrival: '10:50', departure: '10:52' },
      { station: 'RMK', arrival: '11:20', departure: '11:22' },
      { station: 'KDT', arrival: '12:00', departure: null }
    ]
  },
  {
    trainNumber: '1015', // Upcountry Express
    schedules: [
      { station: 'CMB', arrival: null, departure: '15:35' },
      { station: 'MDA', arrival: '15:42', departure: '15:44' },
      { station: 'RGM', arrival: '16:05', departure: '16:07' },
      { station: 'GPH', arrival: '16:25', departure: '16:27' },
      { station: 'VYA', arrival: '16:45', departure: '16:47' },
      { station: 'MIG', arrival: '17:00', departure: '17:02' },
      { station: 'PLG', arrival: '17:15', departure: '17:17' },
      { station: 'AMB', arrival: '17:55', departure: '17:57' },
      { station: 'RMK', arrival: '18:25', departure: '18:27' },
      { station: 'KDT', arrival: '19:05', departure: null }
    ]
  },
  // Return journeys (Kandy to Colombo)
  {
    trainNumber: '1002', // Udarata Menike Return
    schedules: [
      { station: 'KDT', arrival: null, departure: '15:30' },
      { station: 'RMK', arrival: '16:10', departure: '16:12' },
      { station: 'AMB', arrival: '16:40', departure: '16:42' },
      { station: 'PLG', arrival: '17:20', departure: '17:22' },
      { station: 'MIG', arrival: '17:35', departure: '17:37' },
      { station: 'VYA', arrival: '17:50', departure: '17:52' },
      { station: 'GPH', arrival: '18:10', departure: '18:12' },
      { station: 'RGM', arrival: '18:30', departure: '18:32' },
      { station: 'MDA', arrival: '18:53', departure: '18:55' },
      { station: 'CMB', arrival: '19:02', departure: null }
    ]
  },
  {
    trainNumber: '1006', // Podi Menike Return
    schedules: [
      { station: 'KDT', arrival: null, departure: '17:45' },
      { station: 'RMK', arrival: '18:25', departure: '18:27' },
      { station: 'AMB', arrival: '18:55', departure: '18:57' },
      { station: 'PLG', arrival: '19:35', departure: '19:37' },
      { station: 'MIG', arrival: '19:50', departure: '19:52' },
      { station: 'VYA', arrival: '20:05', departure: '20:07' },
      { station: 'GPH', arrival: '20:25', departure: '20:27' },
      { station: 'RGM', arrival: '20:45', departure: '20:47' },
      { station: 'MDA', arrival: '21:08', departure: '21:10' },
      { station: 'CMB', arrival: '21:17', departure: null }
    ]
  }
];

async function addTrainSchedules() {
  const client = await pool.connect();

  try {
    console.log('🚂 Adding train schedules...');

    await client.query('BEGIN');

    // First, add the return trains to the trains table
    const returnTrains = [
      { number: '1002', name: 'Udarata Menike Return', type: 'express', capacity: 800, route: 'Main Line' },
      { number: '1006', name: 'Podi Menike Return', type: 'express', capacity: 600, route: 'Main Line' }
    ];

    for (const train of returnTrains) {
      // Check if train already exists
      const existingTrain = await client.query('SELECT id FROM trains WHERE number = $1', [train.number]);

      if (existingTrain.rows.length === 0) {
        const routeResult = await client.query('SELECT id FROM routes WHERE name = $1', [train.route]);
        const routeId = routeResult.rows[0]?.id;

        if (routeId) {
          await client.query(
            `INSERT INTO trains (number, name, type, capacity, route_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [train.number, train.name, train.type, train.capacity, routeId]
          );
          console.log(`✅ Added train: ${train.number} - ${train.name}`);
        }
      }
    }

    // Create train_schedules table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS train_schedules (
        id SERIAL PRIMARY KEY,
        train_id INTEGER REFERENCES trains(id) ON DELETE CASCADE,
        station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
        arrival_time TIME,
        departure_time TIME,
        platform VARCHAR(10),
        order_index INTEGER NOT NULL,
        days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
        effective_from DATE DEFAULT CURRENT_DATE,
        effective_until DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_train_schedules_unique
      ON train_schedules(train_id, station_id);

      CREATE INDEX IF NOT EXISTS idx_train_schedules_train ON train_schedules(train_id);
      CREATE INDEX IF NOT EXISTS idx_train_schedules_station ON train_schedules(station_id);
    `);

    console.log('📅 Created train_schedules table');

    // Add schedules for each train
    for (const trainSchedule of trainSchedules) {
      const trainResult = await client.query('SELECT id FROM trains WHERE number = $1', [trainSchedule.trainNumber]);
      const trainId = trainResult.rows[0]?.id;

      if (!trainId) {
        console.log(`⚠️  Train ${trainSchedule.trainNumber} not found, skipping...`);
        continue;
      }

      console.log(`📋 Adding schedule for train ${trainSchedule.trainNumber}...`);

      // Clear existing schedules for this train
      await client.query('DELETE FROM train_schedules WHERE train_id = $1', [trainId]);

      let orderIndex = 1;
      for (const schedule of trainSchedule.schedules) {
        const stationResult = await client.query('SELECT id FROM stations WHERE code = $1', [schedule.station]);
        const stationId = stationResult.rows[0]?.id;

        if (stationId) {
          await client.query(
            `INSERT INTO train_schedules (train_id, station_id, arrival_time, departure_time, order_index)
             VALUES ($1, $2, $3, $4, $5)`,
            [trainId, stationId, schedule.arrival, schedule.departure, orderIndex]
          );
          orderIndex++;
        }
      }

      console.log(`✅ Added ${trainSchedule.schedules.length} schedule entries for train ${trainSchedule.trainNumber}`);
    }

    await client.query('COMMIT');
    console.log('🎉 Train schedules added successfully!');

    // Test the search
    console.log('\n🔍 Testing search from Kandy to Colombo...');
    const searchResult = await client.query(`
      SELECT DISTINCT t.id, t.number, t.name, t.type,
             ts1.departure_time as departure_time,
             ts2.arrival_time as arrival_time,
             s1.name as from_station,
             s2.name as to_station
      FROM trains t
      JOIN train_schedules ts1 ON t.id = ts1.train_id
      JOIN train_schedules ts2 ON t.id = ts2.train_id
      JOIN stations s1 ON ts1.station_id = s1.id
      JOIN stations s2 ON ts2.station_id = s2.id
      WHERE s1.name ILIKE '%kandy%'
      AND s2.name ILIKE '%colombo%'
      AND ts1.order_index < ts2.order_index
      ORDER BY ts1.departure_time
    `);

    console.log(`Found ${searchResult.rows.length} trains from Kandy to Colombo:`);
    searchResult.rows.forEach(row => {
      console.log(`  ${row.number} - ${row.name}: ${row.departure_time} → ${row.arrival_time}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to add train schedules:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  addTrainSchedules().catch(console.error);
}

module.exports = addTrainSchedules;
