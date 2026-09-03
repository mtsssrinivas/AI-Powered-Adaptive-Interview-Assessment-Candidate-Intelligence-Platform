import { Router } from 'express';
import { getHealth, getReadiness } from './health.controller';
import { MetricsController } from '../../observability/metrics.controller';

const router = Router();

router.get('/health', getHealth);
router.get('/ready', getReadiness);
router.get('/metrics', MetricsController.getMetrics);

export default router;
