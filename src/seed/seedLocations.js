import { query } from '../db/db.js';

async function seedLocations() {
  console.log('📍 Seeding location history...');
  
  try {
    const employeesResult = await query(
      `SELECT u.id, u.company_id
       FROM users u
       WHERE u.role = 'employee'
       LIMIT 2`
    );

    if (employeesResult.rows.length === 0) {
      console.log('⚠️  No employees found, skipping location seeding\n');
      return;
    }

    let count = 0;
    const now = new Date();

    for (const emp of employeesResult.rows) {
      const geofenceResult = await query(
        `SELECT ST_X(location::geometry) as longitude, 
                ST_Y(location::geometry) as latitude
         FROM geofences 
         WHERE company_id = $1 AND is_active = true
         LIMIT 1`,
        [emp.company_id]
      );

      if (geofenceResult.rows.length === 0) {
        console.log(`  ⚠️  No geofence found for employee ${emp.id}`);
        continue;
      }

      const geofence = geofenceResult.rows[0];

      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(now.getTime() - (i * 3 * 60 * 1000));
        
        await query(
          `INSERT INTO locations (user_id, location, timestamp, metadata)
           VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)`,
          [
            emp.id,
            geofence.longitude + (Math.random() - 0.5) * 0.002,
            geofence.latitude + (Math.random() - 0.5) * 0.002,
            timestamp,
            JSON.stringify({ accuracy: 10, source: 'seed_script' })
          ]
        );
        count++;
      }
    }

    console.log(`✅ Seeded ${count} location points\n`);
  } catch (err) {
    console.error('❌ Error seeding locations:', err.message);
    throw err;
  }
}

export default seedLocations;