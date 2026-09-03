import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 5 — AI Question Generation Engine Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let interviewId = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Taylor Engineer',
        email: 'taylor.questions@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Staff Distributed Systems Engineer',
      });
    authToken = regRes.body.token;

    // 2. Upload resume with project evidence
    const samplePdfRaw = `%PDF-1.4
stream
(Taylor Engineer - Staff Distributed Systems Engineer) Tj
(Project: Consensus Engine implementing Raft protocol with sub-millisecond election timeouts.) Tj
(Skill: Apache Kafka, C++, Distributed Systems) Tj
endstream
%%EOF`;

    await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('resume', Buffer.from(samplePdfRaw), 'taylor_resume.pdf');

    // 3. Create interview with question count limit of 3
    const interviewRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'Staff Distributed Systems Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'STAFF',
        durationMinutes: 30,
        questionCount: 3,
      });

    interviewId = interviewRes.body.id;
  });

  it('POST /api/v1/interviews/:id/next-question should generate first question adhering strictly to schema', async () => {
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.orderIndex).toBe(0);
    expect(res.body).toHaveProperty('question');
    expect(res.body.question.length).toBeGreaterThan(15);
    expect(res.body).toHaveProperty('category');
    expect(res.body).toHaveProperty('skill');
    expect(res.body).toHaveProperty('difficulty');
    expect(res.body).toHaveProperty('expectedConcepts');
    expect(Array.isArray(res.body.expectedConcepts)).toBe(true);
    expect(res.body.expectedConcepts.length).toBeGreaterThan(0);
    expect(res.body.promptVersion).toBe('v1.0.0');
  });

  it('POST /api/v1/interviews/:id/next-question should generate second sequential question (orderIndex: 1)', async () => {
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body.orderIndex).toBe(1);
    expect(res.body).toHaveProperty('question');
  });

  it('POST /api/v1/interviews/:id/next-question should generate third question and complete session when target reached', async () => {
    // Generate 3rd question
    const q3 = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(q3.status).toBe(201);
    expect(q3.body.orderIndex).toBe(2);

    // Attempt 4th question (exceeds limit 3)
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/question limit reached/i);

    // Verify session state is now COMPLETED
    const sessionRes = await request(app)
      .get(`/api/v1/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(sessionRes.body.currentState).toBe('COMPLETED');
  });
});
