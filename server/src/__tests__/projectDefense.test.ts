import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 8 — Resume and Project Defense Mode Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let interviewId = '';
  let firstQuestionId = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Riley Architect',
        email: 'riley.defense@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Staff Distributed Systems Architect',
      });
    authToken = regRes.body.token;
  });

  it('POST /api/v1/interviews/project-defense should initialize adversarial defense session and first question', async () => {
    const res = await request(app)
      .post('/api/v1/interviews/project-defense')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectName: 'High-Throughput Fraud Detection Engine',
        projectDescription: 'Distributed sliding-window risk engine processing 10,000 ops/sec with sub-50ms latency.',
        technologies: ['Apache Kafka', 'Redis', 'PostgreSQL', 'Node.js'],
        claimedOutcomes: ['Reduced false positives by 34%', 'Maintained 99.99% availability'],
        durationMinutes: 30,
        questionCount: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('session');
    expect(res.body.session.interviewMode).toBe('PROJECT_DEFENSE');
    expect(res.body).toHaveProperty('firstQuestion');
    expect(res.body.firstQuestion.questionType).toBe('PROJECT_DEFENSE');
    expect(res.body.firstQuestion.question.length).toBeGreaterThan(20);

    interviewId = res.body.session.id;
    firstQuestionId = res.body.firstQuestion.id;
  });

  it('POST /api/v1/interviews/:id/answer should evaluate deep architectural defense response', async () => {
    const res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/answer`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        questionId: firstQuestionId,
        candidateAnswer:
          'In our Kafka pipeline, to prevent consumer rebalance storms during network partitions, we tuned max.poll.interval.ms and session.timeout.ms. For state management, we stored velocity state in clustered Redis with write-through consistency to PostgreSQL, and enforced strict idempotency keys on every transaction event.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.evaluation.scores.overallScore).toBeGreaterThanOrEqual(75);
  });

  it('GET /api/v1/interviews/:id/project-defense should compute 5-dimensional authenticity verdict', async () => {
    const res = await request(app)
      .get(`/api/v1/interviews/${interviewId}/project-defense`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('projectName');
    expect(res.body).toHaveProperty('scores');

    const scores = res.body.scores;
    expect(scores).toHaveProperty('ownershipAuthenticity');
    expect(scores).toHaveProperty('technicalDepth');
    expect(scores).toHaveProperty('architectureDecisionQuality');
    expect(scores).toHaveProperty('failureHandling');
    expect(scores).toHaveProperty('scalabilityAwareness');
    expect(scores).toHaveProperty('overallScore');

    expect(res.body).toHaveProperty('authenticityVerdict');
    expect(['HIGH', 'MEDIUM', 'LOW', 'SUSPICIOUS']).toContain(res.body.authenticityVerdict);
    expect(res.body).toHaveProperty('executiveVerdictSummary');
  });
});
