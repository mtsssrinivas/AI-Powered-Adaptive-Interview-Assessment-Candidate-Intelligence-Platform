import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/plans', PaymentsController.getPlans);
router.post('/create-order', requireAuth, PaymentsController.createOrder);
router.post('/verify', requireAuth, PaymentsController.verifyPayment);

export default router;
