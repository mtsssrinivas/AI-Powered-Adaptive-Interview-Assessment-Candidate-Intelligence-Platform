import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { SkillsService } from '../modules/skills/skills.service';

describe('Phase 3 — Candidate Skill Graph Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let userId = '';

  beforeAll(async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Samantha Graph',
        email: 'samantha.graph@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Staff Infrastructure Engineer',
      });
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Upload resume to seed skill graph
    const samplePdfRaw = `%PDF-1.4
stream
(Samantha Graph - Staff Infrastructure Engineer) Tj
(Built event-driven platforms with Apache Kafka and Node.js microservices.) Tj
(Administered distributed PostgreSQL clusters and Redis caching layers.) Tj
endstream
%%EOF`;

    await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('resume', Buffer.from(samplePdfRaw), 'samantha_resume.pdf');
  });

  it('GET /api/v1/skills should return skills seeded from resume as EXPOSURE_ONLY', async () => {
    const res = await request(app)
      .get('/api/v1/skills')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const kafka = res.body.find((s: any) => s.skill.toLowerCase().includes('kafka') || s.skill === 'Kafka');
    expect(kafka).toBeDefined();
    expect(kafka.proficiencyLevel).toBe('EXPOSURE_ONLY');
    expect(kafka.proficiencyScore).toBeNull(); // Exposure does not imply demonstration!
    expect(kafka.resumeEvidence.length).toBeGreaterThan(0);
    expect(kafka.assessmentCount).toBe(0);
  });

  it('SkillsService.recordAssessmentResult should empirically elevate proficiency and separate assessment evidence', async () => {
    const result = await SkillsService.recordAssessmentResult(
      userId,
      'Kafka',
      88,
      'Demonstrated high mastery of consumer group rebalances and partition leader failover.'
    );

    expect(result.proficiencyScore).toBe(88);
    expect(result.proficiencyLevel).toBe('EXPERT');
    expect(result.assessmentCount).toBe(1);
    expect(result.assessmentEvidence).toContain(
      'Demonstrated high mastery of consumer group rebalances and partition leader failover.'
    );
    expect(result.resumeEvidence.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/skills/profile should return aggregate candidate skill profile with strengths and category breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/skills/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalSkillsTracked');
    expect(res.body.totalSkillsTracked).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('assessedSkillsCount');
    expect(res.body.assessedSkillsCount).toBe(1); // Kafka assessed
    expect(res.body.unassessedSkillsCount).toBeGreaterThan(0);

    // Top strengths should include Kafka
    expect(res.body.topStrengths.length).toBe(1);
    expect(res.body.topStrengths[0].skill).toBe('Kafka');
    expect(res.body.topStrengths[0].proficiencyScore).toBe(88);

    // Category breakdown
    expect(res.body).toHaveProperty('categoryBreakdown');
    expect(res.body.categoryBreakdown).toHaveProperty('Backend');
  });

  it('GET /api/v1/skills/:skill should return single candidate skill node', async () => {
    const res = await request(app)
      .get('/api/v1/skills/Kafka')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.skill).toBe('Kafka');
    expect(res.body.proficiencyScore).toBe(88);
    expect(res.body.assessmentCount).toBe(1);
  });
});
