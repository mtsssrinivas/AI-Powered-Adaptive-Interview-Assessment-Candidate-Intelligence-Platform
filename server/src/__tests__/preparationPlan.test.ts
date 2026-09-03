import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 11 — Personalized Preparation Plan Test Suite', () => {
  const app = createApp();
  let authToken = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Pat Learner',
        email: 'pat.learner@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Senior Backend Engineer',
      });
    authToken = regRes.body.token;

    // 2. Create and answer interview with technical gap
    const intRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'Senior Backend Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'SENIOR',
        durationMinutes: 30,
        questionCount: 3,
      });

    const qRes = await request(app)
      .post(`/api/v1/interviews/${intRes.body.id}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);

    await request(app)
      .post(`/api/v1/interviews/${intRes.body.id}/answer`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: qRes.body.id,
        candidateAnswer: 'I have some basic exposure to Redis and PostgreSQL, but not sure how to handle cache stampedes or deadlocks.',
      });
  });

  it('GET /api/v1/preparation/plan should generate structured, prioritized preparation roadmap', async () => {
    const res = await request(app)
      .get('/api/v1/preparation/plan')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('targetRole');
    expect(res.body).toHaveProperty('readinessGap');
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);

    const firstRec = res.body.recommendations[0];
    expect(firstRec).toHaveProperty('priority');
    expect(firstRec.priority).toBe(1);
    expect(firstRec).toHaveProperty('topic');
    expect(firstRec).toHaveProperty('reason');
    expect(firstRec).toHaveProperty('recommendedAction');
    expect(firstRec).toHaveProperty('estimatedHours');
    expect(firstRec.estimatedHours).toBeGreaterThan(0);
  });

  it('POST /api/v1/preparation/generate should regenerate roadmap for specific target role', async () => {
    const res = await request(app)
      .post('/api/v1/preparation/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetRole: 'Staff Infrastructure Architect',
      });

    expect(res.status).toBe(201);
    expect(res.body.targetRole).toBe('Staff Infrastructure Architect');
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });
});
