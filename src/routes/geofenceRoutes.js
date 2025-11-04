// src/routes/geofenceRoutes.js
import { Router } from 'express';
const router = Router();
import { createGeofence, deleteGeofence, getCompanyGeofences } from '../controllers/geofenceControllers.js';

router.post('/create', createGeofence);
router.get('/', getCompanyGeofences);
router.delete('/:id', deleteGeofence);

export default router;
