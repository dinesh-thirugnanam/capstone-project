// src/routes/locationRoutes.js
import { Router } from 'express';
const router = Router();
import { trackLocation, getMyLocations } from '../controllers/locationController.js';

router.post('/track', trackLocation);
router.get('/', getMyLocations);

export default router;
