import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 2 — Resume Intelligence Engine Test Suite', () => {
  const app = createApp();
  let authToken = '';

  beforeAll(async () => {
    // Register user for authenticated requests
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jordan Architect',
        email: 'jordan.architect@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Lead Backend Engineer',
      });
    authToken = res.body.token;
  });

  it('POST /api/v1/resumes/upload should reject requests without a file', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/required/i);
  });

  it('POST /api/v1/resumes/upload should reject non-PDF uploads', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('resume', Buffer.from('console.log("hello")'), 'resume.js');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/only pdf documents are supported/i);
  });

  it('POST /api/v1/resumes/upload should process a valid PDF and extract structured profile', async () => {
    // A minimal valid PDF binary stream containing sample text
    const samplePdfRaw = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
72 712 Td
(Jordan Architect - Senior Distributed Systems Engineer) Tj
0 -20 Td
(Experience: Built high-scale microservices using Node.js, Kafka, and PostgreSQL.) Tj
0 -20 Td
(Project: Fraud Detection Engine handling 10,000 ops/sec with sub-50ms latency.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
454
%%EOF`;

    const res = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('resume', Buffer.from(samplePdfRaw), 'jordan_resume.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.resume).toHaveProperty('id');
    expect(res.body.resume.status).toBe('COMPLETED');
    expect(res.body.resume).toHaveProperty('parsedProfile');

    const profile = res.body.resume.parsedProfile;
    expect(profile).toHaveProperty('candidateName');
    expect(profile.skills.length).toBeGreaterThan(0);

    // Evidence validation
    const kafkaSkill = profile.skills.find((s: any) => s.skill.toLowerCase().includes('kafka') || s.category === 'Backend');
    expect(kafkaSkill).toBeDefined();
    expect(kafkaSkill).toHaveProperty('evidence');
    expect(kafkaSkill.source).toBe('resume');

    // Projects validation
    expect(profile.projects.length).toBeGreaterThan(0);
    const proj = profile.projects[0];
    expect(proj).toHaveProperty('projectName');
    expect(proj).toHaveProperty('technologies');
  });

  it('GET /api/v1/resumes should list uploaded resumes for the candidate', async () => {
    const res = await request(app)
      .get('/api/v1/resumes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/resumes/projects should return extracted candidate projects', async () => {
    const res = await request(app)
      .get('/api/v1/resumes/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('projectName');
    expect(res.body[0]).toHaveProperty('technologies');
  });
});
