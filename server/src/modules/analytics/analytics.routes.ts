import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/overview', requireAuth, AnalyticsController.getOverview);
router.get('/trends', requireAuth, AnalyticsController.getTrends);
router.get('/competencies', requireAuth, AnalyticsController.getCompetencies);

export default router;
