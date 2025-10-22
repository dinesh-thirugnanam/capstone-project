import { getMyAttendance } from "../controllers/attendanceControllers.js";
import { Router } from 'express';

const router = Router();
router.get('/my', getMyAttendance);

export default router;