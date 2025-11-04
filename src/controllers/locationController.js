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

export async function trackLocation(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { latitude, longitude, accuracy } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude required' });
  }

  try {
    // 1. Save the location (always save, even outside working hours)
    await query(
      `INSERT INTO locations (user_id, location, timestamp, metadata)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now(), $4)`,
      [user.id, longitude, latitude, JSON.stringify({ accuracy })]
    );

    // 2. Check if user is inside any company geofence
    const geofencesResult = await query(
      `SELECT id, name, radius, 
              ST_X(location::geometry) as longitude, 
              ST_Y(location::geometry) as latitude,
              working_hours,
              working_days
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
       ORDER BY id DESC
       LIMIT 1`,
      [user.id]
    );

    const lastEvent = lastEventResult.rows[0];

    // 4. Check working hours and days
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    let isWorkingHours = true;
    let isWorkingDay = true;
    let reason = null;

    if (insideGeofences.length > 0) {
      const geofence = insideGeofences[0];
      
      // Check working hours
      if (geofence.working_hours) {
        const { start, end } = geofence.working_hours;
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        isWorkingHours = currentTime >= startTime && currentTime <= endTime;
        
        if (!isWorkingHours) {
          reason = `Outside working hours (${start} - ${end})`;
        }
      }
      
      // Check working days
      if (geofence.working_days && geofence.working_days.length > 0) {
        isWorkingDay = geofence.working_days.includes(currentDay);
        
        if (!isWorkingDay) {
          reason = `Not a working day (${currentDay})`;
        }
      }
    }

    // 5. Determine if we need to create a new event
    let newEvent = null;

    if (insideGeofences.length > 0) {
      const currentGeofence = insideGeofences[0];

      const shouldCreateEnter = 
        !lastEvent || 
        lastEvent.event_type === 'EXIT' || 
        (lastEvent.event_type === 'ENTER' && lastEvent.geofence_id !== currentGeofence.id);

      // Only create event if within working hours AND working days
      if (shouldCreateEnter && isWorkingHours && isWorkingDay) {
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
            isWorkingHours,
            isWorkingDay,
            JSON.stringify({ accuracy, detected: 'automatic' })
          ]
        );

        newEvent = result.rows[0];
      }
    } else {
      // User is outside all geofences
      if (lastEvent && lastEvent.event_type === 'ENTER') {
        // Always create EXIT (even outside working hours)
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
            isWorkingHours,
            isWorkingDay,
            JSON.stringify({ accuracy, detected: 'automatic' })
          ]
        );

        newEvent = result.rows[0];
      }
    }

    res.status(200).json({
      locationSaved: true,
      attendanceEvent: newEvent || null,
      insideGeofences: insideGeofences.map(g => g.name),
      isWorkingHours,
      isWorkingDay,
      reason: newEvent ? null : reason,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error tracking location' });
  }
}

