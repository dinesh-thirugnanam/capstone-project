import { query } from '../db/db.js';

async function seedGeofences() {
  console.log('📍 Seeding geofences...');
  
  try {
    const adminsResult = await query(
      `SELECT id, company_id FROM users WHERE role = 'admin' LIMIT 2`
    );

    if (adminsResult.rows.length === 0) {
      throw new Error('No admins found. Run seedUsers first.');
    }

    const geofences = [
      {
        name: 'Main Office - Tech Corp',
        description: 'Headquarters',
        latitude: 12.9716,
        longitude: 77.5946,
        radius: 200,
        address: '123 MG Road, Bangalore',
        workingHours: { start: '09:00', end: '18:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        createdBy: adminsResult.rows[0].id,
        companyId: adminsResult.rows[0].company_id
      },
      {
        name: 'Tech Park Branch',
        description: 'Secondary office',
        latitude: 12.9352,
        longitude: 77.6245,
        radius: 150,
        address: 'Electronic City, Bangalore',
        workingHours: { start: '10:00', end: '19:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        createdBy: adminsResult.rows[0].id,
        companyId: adminsResult.rows[0].company_id
      }
    ];

    if (adminsResult.rows.length > 1) {
      geofences.push({
        name: 'Design Studio HQ',
        description: 'Creative hub',
        latitude: 19.0760,
        longitude: 72.8777,
        radius: 250,
        address: 'Lower Parel, Mumbai',
        workingHours: { start: '09:30', end: '18:30' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        createdBy: adminsResult.rows[1].id,
        companyId: adminsResult.rows[1].company_id
      });
    }

    const results = [];
    for (const gf of geofences) {
      const result = await query(
        `INSERT INTO geofences 
         (name, description, location, radius, is_active, created_by, company_id, address, working_hours, working_days)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, true, $6, $7, $8, $9, $10)
         RETURNING id, name, radius`,
        [
          gf.name, 
          gf.description, 
          gf.longitude, 
          gf.latitude, 
          gf.radius, 
          gf.createdBy, 
          gf.companyId, 
          gf.address,
          JSON.stringify(gf.workingHours),
          gf.workingDays  // Changed from JSON.stringify - PostgreSQL ARRAY type
        ]
      );

      results.push(result.rows[0]);
      console.log(`  ✓ Created: ${gf.name} (${gf.radius}m radius)`);
    }

    console.log(`✅ Seeded ${results.length} geofences\n`);
    return results;
  } catch (err) {
    console.error('❌ Error seeding geofences:', err.message);
    throw err;
  }
}

export default seedGeofences;
