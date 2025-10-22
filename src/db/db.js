// src/db/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // from Supabase
  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text, params) => pool.query(text, params);

export const end = () => pool.end();

export default pool;