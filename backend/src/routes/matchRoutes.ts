import { Router } from 'express';
import { getMatches, updateMatch } from '../controllers/matchController';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateMatchUpdate } from '../middleware/validation';

const router = Router();

router.get('/', getMatches);
router.put('/:id', authenticateJWT, requireRole(['director']), validateMatchUpdate, updateMatch);

export default router;
