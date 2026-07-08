import { Router } from 'express';
import { getStaff, createStaff, updateStaffStatus } from '../controllers/staffController';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateStaffCreate, validateStaffStatusUpdate } from '../middleware/validation';

const router = Router();

router.get('/', getStaff);
router.post('/', authenticateJWT, validateStaffCreate, createStaff);
router.put('/:id/status', authenticateJWT, requireRole(['director', 'security']), validateStaffStatusUpdate, updateStaffStatus);

export default router;
