import { Router } from 'express';
import { InterviewsController } from './interviews.controller';
import { EvaluationsController } from '../evaluations/evaluations.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, InterviewsController.createInterview);
router.get('/', requireAuth, InterviewsController.getInterviews);
router.get('/:id', requireAuth, InterviewsController.getInterviewById);
router.post('/:id/next-question', requireAuth, InterviewsController.getNextQuestion);
router.post('/:id/answer', requireAuth, EvaluationsController.submitAnswer);
router.get('/:id/evaluations', requireAuth, EvaluationsController.getEvaluations);

export default router;
