import { Router } from 'express';
import { getMetrics, getConsolidatedStatus } from '../controllers/metricController';

const router = Router();

router.get('/', getMetrics);
router.get('/consolidated', getConsolidatedStatus);

export default router;
