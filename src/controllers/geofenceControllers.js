// src/controllers/geofenceController.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function createGeofence(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  const { name, description, latitude, longitude, radius, address, working_hours, working_days } = req.body;

  try {
    const result = await query(
      `INSERT INTO geofences 
       (name, description, location, radius, is_active, created_by, company_id, address, working_hours, working_days)
       VALUES
       ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, true, $6, $7, $8, $9, $10)
       RETURNING id, name`,
      [
        name,
        description,
        longitude,
        latitude,
        radius,
        user.id,
        user.company_id,
        address,
        working_hours,
        working_days
      ]
    );

    res.status(201).json({ geofence: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating geofence' });
  }
}



export const getCompanyGeofences = async (req, res) => {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await query(
      `SELECT id, name, description, radius, address, working_hours, working_days,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM geofences
       WHERE company_id = $1 AND is_active = true`,
      [user.company_id]
    );

    res.status(200).json({ geofences: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching geofences' });
  }
};
