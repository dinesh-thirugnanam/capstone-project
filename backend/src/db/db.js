// src/db/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Supabase
  ssl: {
    rejectUnauthorized: false,
  },
  // Connection pool settings for Supabase
  max: 10, // Maximum number of connections
  min: 2, // Minimum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  acquireTimeoutMillis: 60000, // Return an error after 60 seconds if a connection is not acquired
});

export const query = (text, params) => pool.query(text, params);

export const end = () => pool.end();

export default pool;