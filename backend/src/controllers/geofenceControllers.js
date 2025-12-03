// src/controllers/geofenceControllers.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function createGeofence(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  const { name, description, address, working_hours, working_days, geofence_type, latitude, longitude, radius, polygon } = req.body;

  console.log('DEBUG: createGeofence - Received data:', {
    name,
    description,
    address,
    working_hours,
    working_days,
    geofence_type,
    latitude,
    longitude,
    radius,
    polygon
  });

  try {
    let result;
    if (geofence_type === 'polygon') {
      if (!polygon || polygon.length < 3) {
        return res.status(400).json({ message: 'Polygon requires at least 3 points' });
      }
      const coords = polygon.map(p => `${p[0]} ${p[1]}`).join(',');
      const wkt = `POLYGON((${coords},${polygon[0][0]} ${polygon[0][1]}))`;

      console.log('DEBUG: createGeofence - Polygon WKT:', wkt);

      result = await query(
        `INSERT INTO geofences 
         (name, description, polygon_geog, geofence_type, is_active, created_by, company_id, address, working_hours, working_days)
         VALUES
         ($1, $2, ST_GeomFromText($3, 4326)::geography, $4, true, $5, $6, $7, $8, $9)
         RETURNING id, name`,
        [
          name,
          description,
          wkt,
          'polygon',
          user.id,
          user.company_id,
          address,
          working_hours,
          working_days
        ]
      );

      console.log('DEBUG: createGeofence - Polygon stored successfully:', result.rows[0]);

    } else {
      // circle
      console.log('DEBUG: createGeofence - Circle data:', { latitude, longitude, radius });

      result = await query(
        `INSERT INTO geofences 
         (name, description, location, radius, geofence_type, is_active, created_by, company_id, address, working_hours, working_days)
         VALUES
         ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, true, $7, $8, $9, $10, $11)
         RETURNING id, name`,
        [
          name,
          description,
          longitude,
          latitude,
          radius,
          'circle',
          user.id,
          user.company_id,
          address,
          working_hours,
          working_days
        ]
      );

      console.log('DEBUG: createGeofence - Circle stored successfully:', result.rows[0]);
    }

    const responseData = { geofence: result.rows[0] };
    console.log('DEBUG: createGeofence - Response data:', responseData);

    res.status(201).json(responseData);

  } catch (err) {
    console.error('DEBUG: createGeofence - Error:', err);
    res.status(500).json({ message: 'Error creating geofence' });
  }
}

export const getCompanyGeofences = async (req, res) => {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  console.log('DEBUG: getCompanyGeofences - User:', { id: user.id, company_id: user.company_id });

  try {
    const result = await query(
      `SELECT id, name, description, radius, address, working_hours, working_days, geofence_type,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude,
              ST_AsGeoJSON(polygon_geog) AS polygon
       FROM geofences
       WHERE company_id = $1 AND is_active = true`,
      [user.company_id]
    );

    console.log('DEBUG: getCompanyGeofences - Raw DB results:', result.rows);

    // Parse polygon GeoJSON strings to objects for easier frontend handling
    const processedGeofences = result.rows.map(geofence => {
      let processed = { ...geofence };
      if (geofence.polygon) {
        try {
          processed.polygon = JSON.parse(geofence.polygon);
          console.log('DEBUG: getCompanyGeofences - Parsed polygon for geofence', geofence.id, ':', processed.polygon);
        } catch (parseErr) {
          console.error('DEBUG: getCompanyGeofences - Failed to parse polygon GeoJSON for geofence', geofence.id, ':', parseErr);
        }
      }
      return processed;
    });

    const responseData = { geofences: processedGeofences };
    console.log('DEBUG: getCompanyGeofences - Final response data:', JSON.stringify(responseData, null, 2));

    res.status(200).json(responseData);

  } catch (err) {
    console.error('DEBUG: getCompanyGeofences - Error:', err);
    res.status(500).json({ message: 'Error fetching geofences' });
  }
};

export const deleteGeofence = async (req, res) => {
  const user = decodeToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    // Verify geofence belongs to admin's company
    const checkResult = await query(
      `SELECT company_id FROM geofences WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Geofence not found' });
    }

    if (checkResult.rows[0].company_id !== user.company_id) {
      return res.status(403).json({ message: 'Cannot delete geofence from another company' });
    }

    // Delete the geofence
    await query(`DELETE FROM geofences WHERE id = $1`, [id]);

    res.status(200).json({ message: 'Geofence deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting geofence' });
  }
};

