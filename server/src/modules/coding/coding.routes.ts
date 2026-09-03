import { Router } from 'express';
import { CodingController } from './coding.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/problems', CodingController.getProblems);
router.get('/problems/:id', CodingController.getProblemById);
router.post('/run', requireAuth, CodingController.runSampleCode);
router.post('/submit', requireAuth, CodingController.submitSolution);

export default router;
