// src/routes/companyRoutes.js
import { Router } from 'express';
const router = Router();
import { createCompany, getAllCompanies } from '../controllers/companyControllers.js';

router.post('/create', createCompany);
router.get('/', getAllCompanies);

export default router;