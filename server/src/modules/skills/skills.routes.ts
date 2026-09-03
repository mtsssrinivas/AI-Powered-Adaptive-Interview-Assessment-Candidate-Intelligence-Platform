import { Router } from 'express';
import { SkillsController } from './skills.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.get('/', requireAuth, SkillsController.getSkills);
router.get('/profile', requireAuth, SkillsController.getSkillProfile);
router.get('/:skill', requireAuth, SkillsController.getSkillByName);

export default router;
