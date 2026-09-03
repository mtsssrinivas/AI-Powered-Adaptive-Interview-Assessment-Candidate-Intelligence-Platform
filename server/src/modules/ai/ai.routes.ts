import { Router } from 'express';
import { AIController } from './ai.controller';

const router = Router();

router.get('/status', AIController.getStatus);
router.get('/models', AIController.getModels);

export default router;
