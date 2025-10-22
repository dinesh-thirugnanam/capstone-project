// src/controllers/attendanceController.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function getMyAttendance(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await query(
      `SELECT id, event_type, timestamp, metadata, is_working_day, is_working_hours,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM attendance
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [user.id]
    );

    res.status(200).json({ attendance: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching attendance history' });
  }
}
