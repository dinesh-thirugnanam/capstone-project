import { Router } from 'express';
import { getCompanyUsers, getMyProfile, updateMyProfile } from '../controllers/userControllers.js';

const router = Router();

router.get('/company', getCompanyUsers);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
