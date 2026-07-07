import { Router } from 'express';
import { getIncidents, createIncident, dispatchIncident, resolveIncident } from '../controllers/incidentController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getIncidents);
router.post('/', authenticateJWT, createIncident);
router.put('/:id/dispatch', authenticateJWT, requireRole(['director', 'security']), dispatchIncident);
router.put('/:id/resolve', authenticateJWT, requireRole(['director', 'security']), resolveIncident);

export default router;
