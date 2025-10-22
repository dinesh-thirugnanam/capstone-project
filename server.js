// server.js
import express, { json } from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import geofenceRoutes from './src/routes/geofenceRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import locationRoutes from './src/routes/locationRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';

const app = express();
dotenv.config({ path: './.env' });

app.use(json());
app.use('/api/auth', authRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/attendance', attendanceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
