import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 10 — Interview Analytics Engine Test Suite', () => {
  const app = createApp();
  let newUserToken = '';
  let activeUserToken = '';
  let activeUserId = '';
  let interviewId = '';

  beforeAll(async () => {
    // 1. Register user with NO interviews (for zero-state check)
    const emptyUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Empty State User',
        email: 'empty.user@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Junior Frontend Engineer',
      });
    newUserToken = emptyUserRes.body.token;

    // 2. Register user with active interviews
    const activeUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Alex Metrician',
        email: 'alex.metrics@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Lead Platform Engineer',
      });
    activeUserToken = activeUserRes.body.token;
    activeUserId = activeUserRes.body.user.id;

    // Create and conduct interview for active user
    const intRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({
        role: 'Lead Platform Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'LEAD',
        durationMinutes: 45,
        questionCount: 3,
      });
    interviewId = intRes.body.id;

    // Generate question & answer it
    const qRes = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${activeUserToken}`);

    await request(app)
      .post(`/api/v1/interviews/${interviewId}/answer`)
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({
        questionId: qRes.body.id,
        candidateAnswer:
          'When designing high-throughput ingestion pipelines, we utilize partition-key hashing, consumer group scaling with dedicated heartbeat threads, and write-ahead WAL with checkpointing to prevent consumer lag.',
      });

    // Also run a coding problem
    await request(app)
      .post('/api/v1/coding/submit')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({
        interviewId,
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: `
          function twoSum(nums, target) {
            const m = new Map();
            for (let i = 0; i < nums.length; i++) {
              const diff = target - nums[i];
              if (m.has(diff)) return [m.get(diff), i];
              m.set(nums[i], i);
            }
            return [];
          }
        `,
      });
  });

  it('GET /api/v1/analytics/overview for new user should return genuine zeros without fabricated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${newUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dataAvailable).toBe(false);
    expect(res.body.interviewsCompleted).toBe(0);
    expect(res.body.averageScore).toBeNull();
    expect(res.body.technicalCorrectness).toBeNull();
    expect(res.body.questionsCompleted).toBe(0);
  });

  it('GET /api/v1/analytics/overview for active user should calculate real empirical averages across all dimensions', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dataAvailable).toBe(true);
    expect(res.body.questionsCompleted).toBe(1);
    expect(res.body.averageScore).toBeGreaterThanOrEqual(70);
    expect(res.body.technicalCorrectness).toBeGreaterThan(0);
    expect(res.body.communication).toBeGreaterThan(0);
    expect(res.body.problemSolving).toBeGreaterThan(0);
    expect(res.body.codingTestPassRate).toBe(100);
  });

  it('GET /api/v1/analytics/trends should return chronological progression points', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/trends')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('score');
    expect(res.body[0].score).toBeGreaterThanOrEqual(70);
    expect(res.body[0]).toHaveProperty('date');
    expect(res.body[0]).toHaveProperty('mode');
  });

  it('GET /api/v1/analytics/competencies should return assessed competencies', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/competencies')
      .set('Authorization', `Bearer ${activeUserToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('competency');
    expect(res.body[0]).toHaveProperty('averageScore');
    expect(res.body[0].averageScore).toBeGreaterThanOrEqual(70);
  });
});
