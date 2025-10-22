// src/controllers/locationController.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function getMyLocations(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await query(
      `SELECT id, timestamp, metadata,
              ST_X(location::geometry) AS longitude,
              ST_Y(location::geometry) AS latitude
       FROM locations
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [user.id]
    );

    res.status(200).json({ locations: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching location history' });
  }
}

export async function trackLocation(req, res){
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { latitude, longitude, accuracy } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude required' });
  }

  try {
    // 1. Save the location
    await query(
      `INSERT INTO locations (user_id, location, timestamp, metadata)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now(), $4)`,
      [user.id, longitude, latitude, JSON.stringify({ accuracy })]
    );

    // 2. Check if user is inside any company geofence
    const geofencesResult = await query(
      `SELECT id, name, radius, 
              ST_X(location::geometry) as longitude, 
              ST_Y(location::geometry) as latitude
       FROM geofences 
       WHERE company_id = $1 
         AND is_active = true
         AND ST_DWithin(
           location::geography,
           ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           radius
         )`,
      [user.company_id, longitude, latitude]
    );

    const insideGeofences = geofencesResult.rows;

    // 3. Get user's last attendance event
    const lastEventResult = await query(
      `SELECT event_type, geofence_id, timestamp 
      FROM attendance 
      WHERE user_id = $1 
      ORDER BY id DESC  -- Changed from timestamp DESC
      LIMIT 1`,
      [user.id]
    );


    const lastEvent = lastEventResult.rows[0];

    console.log('=== DEBUG ===');
    console.log('Last Event:', lastEvent);
    console.log('Inside Geofences:', insideGeofences);
    console.log('Current Geofence ID:', insideGeofences[0]?.id);

    // 4. Determine if we need to create a new event
    let newEvent = null;

    if (insideGeofences.length > 0) {
      const currentGeofence = insideGeofences[0];

      // Check each condition separately for debugging
      const noLastEvent = !lastEvent;
      const lastWasExit = lastEvent?.event_type === 'EXIT';
      const differentGeofence = lastEvent?.event_type === 'ENTER' && lastEvent?.geofence_id !== currentGeofence.id;

      console.log('Conditions:');
      console.log('  No last event:', noLastEvent);
      console.log('  Last was EXIT:', lastWasExit);
      console.log('  Different geofence:', differentGeofence);
      console.log('  Last geofence_id:', lastEvent?.geofence_id);
      console.log('  Current geofence_id:', currentGeofence.id);

      const shouldCreateEnter = noLastEvent || lastWasExit || differentGeofence;

      console.log('Should create ENTER:', shouldCreateEnter);

      if (shouldCreateEnter) {
        const result = await query(
          `INSERT INTO attendance 
           (user_id, geofence_id, event_type, timestamp, location, is_working_hours, is_working_day, metadata)
           VALUES ($1, $2, 'ENTER', now(), ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7)
           RETURNING id, event_type, timestamp`,
          [
            user.id,
            currentGeofence.id,
            longitude,
            latitude,
            true,
            true,
            JSON.stringify({ accuracy, detected: 'automatic' })
          ]
        );

        newEvent = result.rows[0];
        console.log('Created ENTER event:', newEvent);
      } else {
        console.log('Skipped ENTER - already inside same geofence');
      }
    } else {
      // User is outside all geofences
      if (lastEvent && lastEvent.event_type === 'ENTER') {
        const result = await query(
          `INSERT INTO attendance 
           (user_id, geofence_id, event_type, timestamp, location, is_working_hours, is_working_day, metadata)
           VALUES ($1, $2, 'EXIT', now(), ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7)
           RETURNING id, event_type, timestamp`,
          [
            user.id,
            lastEvent.geofence_id,
            longitude,
            latitude,
            true,
            true,
            JSON.stringify({ accuracy, detected: 'automatic' })
          ]
        );

        newEvent = result.rows[0];
        console.log('Created EXIT event:', newEvent);
      }
    }

    res.status(200).json({
      locationSaved: true,
      attendanceEvent: newEvent || null,
      insideGeofences: insideGeofences.map(g => g.name)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error tracking location' });
  }
};
