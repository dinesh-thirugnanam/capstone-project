// src/controllers/attendanceControllers.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function getMyAttendance(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await query(
      `SELECT 
         a.id,
         a.user_id,
         a.geofence_id,
         a.event_type,
         a.timestamp,
         a.is_working_hours,
         a.is_working_day,
         a.metadata,
         ST_AsGeoJSON(a.location) as location,
         g.name as geofence_name
       FROM attendance a
       LEFT JOIN geofences g ON a.geofence_id = g.id
       WHERE a.user_id = $1
       ORDER BY a.timestamp DESC
       LIMIT 100`,
      [user.id]
    );

    const attendance = result.rows.map(row => ({
      ...row,
      location: row.location ? JSON.parse(row.location) : null
    }));

    res.status(200).json({ attendance });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
}
