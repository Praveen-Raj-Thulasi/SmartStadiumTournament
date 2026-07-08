import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateAuth } from '../middleware/validation';

const router = Router();

router.post('/register', validateAuth(true), register);
router.post('/login', validateAuth(false), login);

export default router;
