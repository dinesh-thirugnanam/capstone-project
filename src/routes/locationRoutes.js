import { Router } from 'express';
import { getMyLocations, trackLocation } from "../controllers/locationController.js";

const router = Router();
router.get('/my', getMyLocations);
router.post('/track', trackLocation);

export default router;