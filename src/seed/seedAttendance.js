import { query } from '../db/db.js';

async function seedAttendance() {
  console.log('📋 Seeding attendance...');
  
  try {
    // Get employees and geofences
    const employeesResult = await query(
      `SELECT u.id, u.company_id 
       FROM users u 
       WHERE u.role = 'employee' LIMIT 3`
    );

    const geofencesResult = await query(
      `SELECT id, company_id, ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude 
       FROM geofences`
    );

    if (employeesResult.rows.length === 0 || geofencesResult.rows.length === 0) {
      throw new Error('Need employees and geofences. Run previous seeds first.');
    }

    const attendance = [];

    // Generate realistic attendance for last 5 days
    const daysBack = 5;
    for (let day = 0; day < daysBack; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(9, 0, 0, 0); // 9 AM entry

      for (const emp of employeesResult.rows) {
        // Find geofence for this employee's company
        const geofence = geofencesResult.rows.find(gf => gf.companyid === emp.companyid);
        if (!geofence) continue;

        const entryTime = new Date(date);
        entryTime.setMinutes(entryTime.getMinutes() + Math.floor(Math.random() * 30)); // 9:00-9:30

        const exitTime = new Date(entryTime);
        exitTime.setHours(18, 0, 0, 0); // 6 PM exit
        exitTime.setMinutes(exitTime.getMinutes() + Math.floor(Math.random() * 60)); // 6:00-7:00

        attendance.push({
          userId: emp.id,
          geofenceId: geofence.id,
          eventType: 'ENTER',
          timestamp: entryTime,
          latitude: geofence.latitude + (Math.random() - 0.5) * 0.001,
          longitude: geofence.longitude + (Math.random() - 0.5) * 0.001,
          isWorkingDay: date.getDay() >= 1 && date.getDay() <= 5,
          isWorkingHours: true
        });

        attendance.push({
          userId: emp.id,
          geofenceId: geofence.id,
          eventType: 'EXIT',
          timestamp: exitTime,
          latitude: geofence.latitude + (Math.random() - 0.5) * 0.001,
          longitude: geofence.longitude + (Math.random() - 0.5) * 0.001,
          isWorkingDay: date.getDay() >= 1 && date.getDay() <= 5,
          isWorkingHours: true
        });
      }
    }

    let count = 0;
    for (const att of attendance) {
      await query(
        `INSERT INTO attendance 
         (user_id, geofence_id, event_type, timestamp, location, is_working_day, is_working_hours, metadata)
         VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9::jsonb)`,
        [
          att.userId, 
          att.geofenceId, 
          att.eventType, 
          att.timestamp,
          att.longitude,
          att.latitude,
          att.isWorkingDay,
          att.isWorkingHours,
          { source: 'seed_script' }
        ]
      );
      count++;
    }

    console.log(`✅ Seeded ${count} attendance records\n`);
  } catch (err) {
    console.error('❌ Error seeding attendance:', err.message);
    throw err;
  }
}

export default seedAttendance;
