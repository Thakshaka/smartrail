const { query } = require('../config/database');

async function quickFix() {
  try {
    console.log('🔧 Quick fix: Adding route stations for Kandy-Colombo...');
    
    // Get route and station IDs
    const mainLineResult = await query('SELECT id FROM routes WHERE name = $1', ['Main Line']);
    const routeId = mainLineResult.rows[0]?.id;
    
    const colomboResult = await query('SELECT id FROM stations WHERE name ILIKE $1', ['%Colombo%']);
    const kandyResult = await query('SELECT id FROM stations WHERE name ILIKE $1', ['%Kandy%']);
    
    const colomboId = colomboResult.rows[0]?.id;
    const kandyId = kandyResult.rows[0]?.id;
    
    console.log(`Route ID: ${routeId}, Colombo ID: ${colomboId}, Kandy ID: ${kandyId}`);
    
    if (routeId && colomboId && kandyId) {
      // Clear existing route stations
      await query('DELETE FROM route_stations WHERE route_id = $1', [routeId]);
      
      // Add simple route stations
      await query(`
        INSERT INTO route_stations (route_id, station_id, order_index, arrival_time, departure_time)
        VALUES 
        ($1, $2, 1, NULL, '06:00:00'),
        ($1, $3, 2, '09:30:00', NULL)
      `, [routeId, colomboId, kandyId]);
      
      console.log('✅ Route stations added successfully!');
      
      // Test the search
      const searchResult = await query(`
        SELECT DISTINCT t.*, 
               rs1.departure_time as departure_time,
               rs2.arrival_time as arrival_time
        FROM trains t
        LEFT JOIN routes r ON t.route_id = r.id
        LEFT JOIN route_stations rs1 ON r.id = rs1.route_id
        LEFT JOIN route_stations rs2 ON r.id = rs2.route_id
        LEFT JOIN stations st1 ON rs1.station_id = st1.id
        LEFT JOIN stations st2 ON rs2.station_id = st2.id
        WHERE st1.name ILIKE '%Colombo%'
        AND st2.name ILIKE '%Kandy%'
        AND rs1.order_index < rs2.order_index
      `);
      
      console.log(`Found ${searchResult.rows.length} trains from Colombo to Kandy`);
      searchResult.rows.forEach(row => {
        console.log(`  ${row.number} - ${row.name}: ${row.departure_time} → ${row.arrival_time}`);
      });
      
    } else {
      console.log('❌ Could not find required route or stations');
    }
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  }
}

quickFix();
