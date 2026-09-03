import { Router } from 'express';
import { KnowledgeController } from './knowledge.controller';

const router = Router();

router.get('/search', KnowledgeController.search);
router.get('/topics', KnowledgeController.getTopics);

export default router;
