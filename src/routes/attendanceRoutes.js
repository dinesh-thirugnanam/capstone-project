import { Router } from 'express';
import { getMyAttendance, getCompanyAttendance, getUserAttendance } from '../controllers/attendanceControllers.js';

const router = Router();

router.get('/my', getMyAttendance);
router.get('/company', getCompanyAttendance);
router.get('/user/:id', getUserAttendance);

export default router;
