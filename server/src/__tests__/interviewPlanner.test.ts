import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { InterviewStateMachine } from '../modules/interviews/interviewStateMachine';
import { InterviewPlannerService } from '../modules/interviews/planner.service';
import { InterviewsService } from '../modules/interviews/interviews.service';

describe('Phase 4 — Adaptive Interview Planner & State Machine Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Morgan Architect',
        email: 'morgan.planner@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Principal Distributed Systems Engineer',
      });
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  describe('Interview State Machine', () => {
    it('should permit valid forward transitions in interview lifecycle', () => {
      expect(InterviewStateMachine.canTransition('PLANNED', 'QUESTION_ACTIVE')).toBe(true);
      expect(InterviewStateMachine.canTransition('QUESTION_ACTIVE', 'ANSWER_SUBMITTED')).toBe(true);
      expect(InterviewStateMachine.canTransition('ANSWER_SUBMITTED', 'ANSWER_EVALUATED')).toBe(true);
      expect(InterviewStateMachine.canTransition('ANSWER_EVALUATED', 'NEXT_QUESTION')).toBe(true);
      expect(InterviewStateMachine.canTransition('COMPLETED', 'REPORT_GENERATED')).toBe(true);
    });

    it('should reject invalid or skipped transitions', () => {
      expect(InterviewStateMachine.canTransition('PLANNED', 'REPORT_GENERATED')).toBe(false);
      expect(InterviewStateMachine.canTransition('QUESTION_ACTIVE', 'REPORT_GENERATED')).toBe(false);
      expect(InterviewStateMachine.canTransition('CREATED', 'COMPLETED')).toBe(false);
      expect(() =>
        InterviewStateMachine.assertValidTransition('PLANNED', 'REPORT_GENERATED')
      ).toThrowError(/invalid interview state transition/i);
    });
  });

  describe('Interview Planning Engine', () => {
    it('should generate balanced competency weights summing to 100%', async () => {
      const plan = await InterviewPlannerService.generatePlan(userId, {
        role: 'Senior Backend Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'SENIOR',
        durationMinutes: 45,
        questionCount: 8,
        selectedSkills: ['Node.js', 'PostgreSQL', 'Redis'],
      });

      expect(plan.targetRole).toBe('Senior Backend Engineer');
      expect(plan.estimatedDurationMinutes).toBe(45);
      expect(plan.totalQuestionTarget).toBe(8);
      expect(plan.competencyWeights.length).toBeGreaterThan(0);

      const totalPercentage = plan.competencyWeights.reduce((sum, w) => sum + w.percentage, 0);
      expect(Math.abs(totalPercentage - 100)).toBeLessThanOrEqual(2); // Rounding tolerance
    });

    it('should support custom competency weight overrides', async () => {
      const plan = await InterviewPlannerService.generatePlan(userId, {
        role: 'System Architect',
        interviewMode: 'SYSTEM_DESIGN',
        experienceLevel: 'STAFF',
        durationMinutes: 60,
        questionCount: 6,
        selectedSkills: ['Distributed Storage', 'Consensus'],
        customWeights: [
          { category: 'System Design', percentage: 70 },
          { category: 'Databases', percentage: 30 },
        ],
      });

      expect(plan.competencyWeights.length).toBe(2);
      expect(plan.competencyWeights[0].percentage).toBe(70);
      expect(plan.competencyWeights[1].percentage).toBe(30);
    });
  });

  describe('Interview Sessions API Endpoints', () => {
    let createdInterviewId = '';

    it('POST /api/v1/interviews should initialize new interview in PLANNED state', async () => {
      const res = await request(app)
        .post('/api/v1/interviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'Backend Platform Engineer',
          interviewMode: 'BACKEND',
          experienceLevel: 'SENIOR',
          durationMinutes: 30,
          questionCount: 6,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.currentState).toBe('PLANNED');
      expect(res.body).toHaveProperty('plan');
      expect(res.body.plan.competencyWeights.length).toBeGreaterThan(0);
      createdInterviewId = res.body.id;
    });

    it('GET /api/v1/interviews/:id should retrieve active session', async () => {
      const res = await request(app)
        .get(`/api/v1/interviews/${createdInterviewId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdInterviewId);
      expect(res.body.role).toBe('Backend Platform Engineer');
    });

    it('GET /api/v1/interviews should list all user sessions', async () => {
      const res = await request(app)
        .get('/api/v1/interviews')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(createdInterviewId);
    });

    it('InterviewsService.transitionState should update state adhering to rules', async () => {
      const updated = await InterviewsService.transitionState(
        createdInterviewId,
        'QUESTION_ACTIVE'
      );
      expect(updated.currentState).toBe('QUESTION_ACTIVE');
    });
  });
});
