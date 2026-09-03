import { Router } from 'express';
import { CreditsController } from './credits.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/balance', requireAuth, CreditsController.getBalance);
router.post('/deduct', requireAuth, CreditsController.deduct);

export default router;
