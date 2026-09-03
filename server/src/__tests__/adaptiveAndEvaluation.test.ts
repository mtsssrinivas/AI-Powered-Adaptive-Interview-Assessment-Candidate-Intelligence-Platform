import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 6 & 7 — Adaptive Engine & 6-Dimensional Evaluation Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let interviewId = '';
  let firstQuestionId = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Devon Evaluator',
        email: 'devon.eval@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Senior Backend Engineer',
      });
    authToken = regRes.body.token;

    // 2. Create interview with 3 questions
    const interviewRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'Senior Backend Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'SENIOR',
        durationMinutes: 30,
        questionCount: 3,
      });
    interviewId = interviewRes.body.id;

    // 3. Generate first question
    const q1Res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);
    firstQuestionId = q1Res.body.id;
  });

  it('POST /api/v1/interviews/:id/answer should evaluate strong answer across 6 dimensions and adaptively advance', async () => {
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/answer`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: firstQuestionId,
        candidateAnswer:
          'To handle backpressure and connection pool exhaustion, we implement TCP stream pausing with high-water marks, queue buffering with bounded capacity, connection pool timeout ceilings, and circuit breakers like Hystrix or resilient bulkhead patterns.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('evaluation');

    const evalData = res.body.evaluation;
    // 6-dimensional rubric check
    expect(evalData.scores).toHaveProperty('technicalCorrectness');
    expect(evalData.scores).toHaveProperty('relevance');
    expect(evalData.scores).toHaveProperty('depth');
    expect(evalData.scores).toHaveProperty('problemSolving');
    expect(evalData.scores).toHaveProperty('communication');
    expect(evalData.scores).toHaveProperty('completeness');
    expect(evalData.scores).toHaveProperty('overallScore');

    expect(evalData.scores.overallScore).toBeGreaterThanOrEqual(75);
    expect(evalData.strengths.length).toBeGreaterThan(0);
    expect(evalData).toHaveProperty('evidence');

    // Adaptive decision check
    expect(evalData).toHaveProperty('adaptiveDecision');
    const decision = evalData.adaptiveDecision;
    expect(decision).toHaveProperty('nextDifficulty');
    expect(decision).toHaveProperty('reason');
    expect(decision.reason.length).toBeGreaterThan(10);

    // State transition check: session is now NEXT_QUESTION
    expect(res.body.session.currentState).toBe('NEXT_QUESTION');
  });

  it('POST /api/v1/interviews/:id/answer should reject duplicate answer submissions for the same question', async () => {
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/answer`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: firstQuestionId,
        candidateAnswer: 'Duplicate attempt to answer the same question.',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot submit answer when interview state is 'NEXT_QUESTION'/i);
  });

  it('GET /api/v1/interviews/:id/evaluations should retrieve all evaluated responses', async () => {
    const res = await request(app)
      .get(`/api/v1/interviews/${interviewId}/evaluations`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].questionId).toBe(firstQuestionId);
    expect(res.body[0].scores.overallScore).toBeGreaterThanOrEqual(75);
  });
});
