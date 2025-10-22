import { Router } from "express";
import { getCompanyUsers } from "../controllers/userControllers.js";


const router = Router();
router.get('/company', getCompanyUsers);

export default router;