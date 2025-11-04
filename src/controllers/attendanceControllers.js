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

export async function getCompanyAttendance(req, res) {
  const user = decodeToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const result = await query(
      `SELECT 
         a.id,
         a.event_type,
         a.timestamp,
         a.is_working_hours,
         a.is_working_day,
         u.email as user_email,
         up.first_name,
         up.last_name,
         g.name as geofence_name,
         ST_X(a.location::geometry) as longitude,
         ST_Y(a.location::geometry) as latitude
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN geofences g ON a.geofence_id = g.id
       WHERE u.company_id = $1
       ORDER BY a.timestamp DESC
       LIMIT 500`,
      [user.company_id]
    );

    res.status(200).json({ attendance: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
}

// NEW: Get attendance for specific user (admin only)
export async function getUserAttendance(req, res) {
  const user = decodeToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    // Verify user belongs to same company
    const userCheck = await query(
      `SELECT company_id FROM users WHERE id = $1`,
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck.rows[0].company_id !== user.company_id) {
      return res.status(403).json({ message: 'Cannot view attendance from another company' });
    }

    const result = await query(
      `SELECT 
         a.id,
         a.event_type,
         a.timestamp,
         a.is_working_hours,
         a.is_working_day,
         g.name as geofence_name,
         ST_X(a.location::geometry) as longitude,
         ST_Y(a.location::geometry) as latitude
       FROM attendance a
       LEFT JOIN geofences g ON a.geofence_id = g.id
       WHERE a.user_id = $1
       ORDER BY a.timestamp DESC
       LIMIT 100`,
      [id]
    );

    res.status(200).json({ attendance: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
}