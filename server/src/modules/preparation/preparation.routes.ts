import { Router } from 'express';
import { PreparationController } from './preparation.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/plan', requireAuth, PreparationController.getPlan);
router.post('/generate', requireAuth, PreparationController.generatePlan);

export default router;
