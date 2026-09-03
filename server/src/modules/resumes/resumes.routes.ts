import { Router } from 'express';
import { ResumesController } from './resumes.controller';
import { requireAuth } from '../../middleware/authMiddleware';
import { uploadResume } from '../../middleware/uploadMiddleware';

const router = Router();

router.post('/upload', requireAuth, uploadResume.single('resume'), ResumesController.uploadResume);
router.post('/', requireAuth, uploadResume.single('resume'), ResumesController.uploadResume);
router.get('/', requireAuth, ResumesController.getResumes);
router.get('/projects', requireAuth, ResumesController.getExtractedProjects);
router.get('/:id', requireAuth, ResumesController.getResumeById);

export default router;
