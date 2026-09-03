import { Router } from 'express';

const router = Router();

// Will be fully implemented in Phase 1
router.get('/', (_req, res) => {
  res.json({ message: 'Auth module active' });
});

export default router;
