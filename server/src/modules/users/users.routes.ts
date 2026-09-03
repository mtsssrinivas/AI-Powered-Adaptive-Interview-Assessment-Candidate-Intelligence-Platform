import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/intelligence-profile', requireAuth, UsersController.getIntelligenceProfile);
router.get('/readiness', requireAuth, UsersController.getReadiness);

export default router;
