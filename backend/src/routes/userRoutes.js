import { Router } from 'express';
import { getCompanyUsers, getMyProfile, updateMyProfile, createEmployee, deleteEmployee } from '../controllers/userControllers.js';

const router = Router();

router.get('/company', getCompanyUsers);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

// Admin only routes
router.post('/', createEmployee);
router.delete('/:id', deleteEmployee);

export default router;
