const { query } = require('../config/database');

async function createAlertsTable() {
  try {
    console.log('🔄 Creating alerts table...');

    // Create alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50) NOT NULL CHECK (type IN ('delay', 'cancellation', 'platform_change', 'service_update', 'weather')),
          severity VARCHAR(20) NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          train_id INTEGER,
          station_id INTEGER,
          is_read BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Alerts table created successfully');

    // Create indexes
    await query('CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type)');
    await query('CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)');
    await query('CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active)');
    await query('CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)');

    console.log('✅ Indexes created successfully');

    // Insert sample alerts
    await query(`
      INSERT INTO alerts (type, severity, title, message, train_id, station_id) VALUES
      ('delay', 'warning', 'Train Delay', 'Udarata Menike (Train #1001) is delayed by 15 minutes due to signal issues.', 1, 3),
      ('cancellation', 'error', 'Service Cancellation', 'Evening Express (Train #1015) service has been cancelled due to technical issues.', 3, NULL),
      ('platform_change', 'info', 'Platform Change', 'Podi Menike (Train #1005) will depart from Platform 3 instead of Platform 2.', 2, 1),
      ('service_update', 'info', 'Service Update', 'Additional coaches have been added to Intercity Express due to high demand.', 4, NULL),
      ('weather', 'warning', 'Weather Alert', 'Heavy rainfall expected in the hill country. Train services may experience delays.', NULL, NULL)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Sample alerts inserted successfully');

    // Create trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger
    await query(`
      DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
      CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log('✅ Triggers created successfully');
    console.log('🎉 Alerts table setup complete!');

  } catch (error) {
    console.error('❌ Error creating alerts table:', error.message);
  } finally {
    process.exit(0);
  }
}

createAlertsTable();
