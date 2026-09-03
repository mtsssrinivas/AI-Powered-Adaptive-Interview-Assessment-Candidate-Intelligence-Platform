import { Router } from 'express';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import resumesRoutes from './modules/resumes/resumes.routes';
import interviewsRoutes from './modules/interviews/interviews.routes';
import questionsRoutes from './modules/questions/questions.routes';
import evaluationsRoutes from './modules/evaluations/evaluations.routes';
import skillsRoutes from './modules/skills/skills.routes';
import reportsRoutes from './modules/reports/reports.routes';
import codingRoutes from './modules/coding/coding.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import creditsRoutes from './modules/credits/credits.routes';
import aiRoutes from './modules/ai/ai.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import preparationRoutes from './modules/preparation/preparation.routes';

export const createV1Router = (): Router => {
  const router = Router();

  router.use('/', healthRoutes);
  router.use('/auth', authRoutes);
  router.use('/users', usersRoutes);
  router.use('/resumes', resumesRoutes);
  router.use('/interviews', interviewsRoutes);
  router.use('/questions', questionsRoutes);
  router.use('/evaluations', evaluationsRoutes);
  router.use('/skills', skillsRoutes);
  router.use('/reports', reportsRoutes);
  router.use('/coding', codingRoutes);
  router.use('/payments', paymentsRoutes);
  router.use('/credits', creditsRoutes);
  router.use('/ai', aiRoutes);
  router.use('/analytics', analyticsRoutes);
  router.use('/preparation', preparationRoutes);

  return router;
};
