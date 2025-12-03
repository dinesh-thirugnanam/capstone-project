// migrate.js
import { query } from './src/db/db.js';

async function migrate() {
  try {
    // Add new columns
    await query(`
      ALTER TABLE public.geofences
        ADD COLUMN IF NOT EXISTS polygon_geog geography(POLYGON, 4326),
        ADD COLUMN IF NOT EXISTS geofence_type text DEFAULT 'circle' CHECK (geofence_type IN ('circle', 'polygon'));
    `);

    // Make location and radius nullable for polygons
    await query(`
      ALTER TABLE public.geofences
        ALTER COLUMN location DROP NOT NULL,
        ALTER COLUMN radius DROP NOT NULL;
    `);

    // Update existing rows
    await query(`
      UPDATE geofences SET geofence_type = 'circle' WHERE geofence_type IS NULL;
    `);

    // Add index
    await query(`
      CREATE INDEX IF NOT EXISTS idx_geofence_polygon ON public.geofences USING GIST (polygon_geog);
    `);

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();