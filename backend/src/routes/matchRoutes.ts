import { Router } from 'express';
import { getMatches, updateMatch } from '../controllers/matchController';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getMatches);
router.put('/:id', authenticateJWT, requireRole(['director']), updateMatch);

export default router;
