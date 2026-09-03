import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 12 — Candidate Intelligence Profile Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let interviewId = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sydney Intel',
        email: 'sydney.intel@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Staff Distributed Systems Architect',
      });
    authToken = regRes.body.token;

    // 2. Upload resume
    const samplePdfRaw = `%PDF-1.4
stream
(Sydney Intel - Staff Distributed Systems Architect) Tj
(Built event-driven microservices using Node.js, Kafka, and PostgreSQL.) Tj
(Designed sliding-window fraud detection engine with sub-50ms latency.) Tj
endstream
%%EOF`;

    await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('resume', Buffer.from(samplePdfRaw), 'sydney_resume.pdf');

    // 3. Create and answer 3 questions
    const intRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'Staff Distributed Systems Architect',
        interviewMode: 'BACKEND',
        experienceLevel: 'STAFF',
        durationMinutes: 45,
        questionCount: 3,
      });
    interviewId = intRes.body.id;

    for (let i = 0; i < 3; i++) {
      const qRes = await request(app)
        .post(`/api/v1/interviews/${interviewId}/next-question`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .post(`/api/v1/interviews/${interviewId}/answer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: qRes.body.id,
          candidateAnswer:
            'We implemented distributed transaction isolation with optimistic lock validation, write-ahead logging with checkpoint compaction, and Kafka consumer group rebalance mitigation using cooperative sticky assignors.',
        });
    }
  });

  it('GET /api/v1/users/intelligence-profile should return comprehensive aggregated candidate intelligence profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/intelligence-profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('readinessRating');
    expect(res.body.readinessRating).toBeGreaterThanOrEqual(70);
    expect(res.body).toHaveProperty('hiringRecommendation');
    expect(['STRONG_HIRE', 'HIRE']).toContain(res.body.hiringRecommendation);

    expect(res.body).toHaveProperty('executiveSummary');
    expect(res.body.executiveSummary.length).toBeGreaterThan(20);

    expect(res.body).toHaveProperty('verifiedSkills');
    expect(Array.isArray(res.body.verifiedSkills)).toBe(true);
    expect(res.body.verifiedSkills.length).toBeGreaterThan(0);

    expect(res.body).toHaveProperty('competencyRadar');
    expect(Array.isArray(res.body.competencyRadar)).toBe(true);
    expect(res.body.competencyRadar.length).toBeGreaterThanOrEqual(5);

    expect(res.body).toHaveProperty('projectAuthenticityIndex');
    expect(res.body.projectAuthenticityIndex).toBeGreaterThan(0);
  });

  it('GET /api/v1/users/readiness should return concise readiness rating and hiring recommendation', async () => {
    const res = await request(app)
      .get('/api/v1/users/readiness')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('readinessRating');
    expect(res.body.readinessRating).toBeGreaterThanOrEqual(70);
    expect(res.body).toHaveProperty('hiringRecommendation');
    expect(['STRONG_HIRE', 'HIRE']).toContain(res.body.hiringRecommendation);
  });
});
