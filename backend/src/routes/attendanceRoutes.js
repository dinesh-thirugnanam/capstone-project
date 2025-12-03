// src/routes/attendanceRoutes.js
import { Router } from 'express';
const router = Router();
import { getMyAttendance } from '../controllers/attendanceControllers.js';

router.get('/', getMyAttendance);

export default router;
