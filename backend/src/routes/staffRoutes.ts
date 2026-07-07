import { Router } from 'express';
import { getStaff, createStaff, updateStaffStatus } from '../controllers/staffController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getStaff);
router.post('/', authenticateJWT, createStaff);
router.put('/:id/status', authenticateJWT, requireRole(['director', 'security']), updateStaffStatus);

export default router;
