// src/routes/geofenceRoutes.js
import { Router } from 'express';
const router = Router();
import { createGeofence, getCompanyGeofences } from '../controllers/geofenceControllers.js';

router.post('/create', createGeofence);
router.get('/', getCompanyGeofences);

export default router;
