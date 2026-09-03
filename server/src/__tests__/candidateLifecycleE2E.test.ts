import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 18 — Complete Candidate Lifecycle E2E Test Suite', () => {
  const app = createApp();

  it('should execute complete lifecycle: Auth -> Resume -> Interview -> Adaptive Answer -> Coding -> Report -> Analytics', async () => {
    // 1. Candidate Registration
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Morgan Lifecycle',
        email: `morgan.${Date.now()}@interviewiq.ai`,
        password: 'Password123!',
        targetRole: 'Staff Distributed Systems Engineer',
      });

    expect(regRes.status).toBe(201);
    const token = regRes.body.token;
    const user = regRes.body.user;
    expect(token).toBeDefined();

    // 2. Initial Credit Balance Verification (Welcome credits)
    const balanceRes = await request(app)
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balanceRes.status).toBe(200);
    expect(balanceRes.body.currentBalance).toBe(100);

    // 3. Resume Upload & Automatic Skill Graph Seeding
    const samplePdf = `%PDF-1.4
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
(Morgan Lifecycle - Staff Distributed Systems Engineer) Tj
0 -20 Td
(Expertise: Built high-scale microservices using Node.js, Kafka, Redis, and PostgreSQL.) Tj
0 -20 Td
(Project: Raft consensus storage node with 99.99% linearizability.) Tj
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

    const resumeRes = await request(app)
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', Buffer.from(samplePdf), 'morgan_resume.pdf');

    expect(resumeRes.status).toBe(201);
    expect(resumeRes.body.resume.parsedProfile.skills.length).toBeGreaterThan(0);

    // 4. Verify Candidate Skill Graph in EXPOSURE_ONLY state
    const skillsRes = await request(app)
      .get('/api/v1/skills')
      .set('Authorization', `Bearer ${token}`);

    expect(skillsRes.status).toBe(200);
    expect(skillsRes.body.length).toBeGreaterThan(0);
    expect(skillsRes.body[0].proficiencyLevel).toBe('EXPOSURE_ONLY');

    // 5. Configure and Start Adaptive Interview Session
    const intRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: 'Staff Distributed Systems Engineer',
        interviewMode: 'BACKEND',
        experienceLevel: 'STAFF',
        durationMinutes: 45,
        questionCount: 3,
      });

    expect(intRes.status).toBe(201);
    const interviewId = intRes.body.id;
    expect(intRes.body.currentState).toBe('PLANNED');

    // 6. Deduct credits for interview session
    const deductRes = await request(app)
      .post('/api/v1/credits/deduct')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 25,
        reason: 'Adaptive Interview Session Start',
        referenceId: interviewId,
      });

    expect(deductRes.status).toBe(200);
    expect(deductRes.body.currentBalance).toBe(75);

    // 7. Request First Grounded Question
    const q1Res = await request(app)
      .post(`/api/v1/interviews/${interviewId}/next-question`)
      .set('Authorization', `Bearer ${token}`);

    expect(q1Res.status).toBe(201);
    expect(q1Res.body).toHaveProperty('question');

    // 8. Submit High-Quality Technical Answer
    const answerRes = await request(app)
      .post(`/api/v1/interviews/${interviewId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: q1Res.body.id,
        candidateAnswer:
          'In our Raft-based storage node, we implemented leader election with randomized timeouts, heartbeats via gRPC stream channels, write-ahead WAL with synchronous fsync barriers, and state machine log compaction to maintain linearizable reads under asymmetric network partitions.',
      });

    expect(answerRes.status).toBe(200);
    expect(answerRes.body.evaluation.scores.overallScore).toBeGreaterThanOrEqual(70);

    // 9. Execute Real DSA Coding Submission
    const codingRes = await request(app)
      .post('/api/v1/coding/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        interviewId,
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: `
          function twoSum(nums, target) {
            const map = new Map();
            for (let i = 0; i < nums.length; i++) {
              const complement = target - nums[i];
              if (map.has(complement)) return [map.get(complement), i];
              map.set(nums[i], i);
            }
            return [];
          }
        `,
      });

    expect(codingRes.status).toBe(200);
    expect(codingRes.body.status).toBe('ACCEPTED');
    expect(codingRes.body.passedCount).toBe(4);

    // 10. Generate Candidate Intelligence Profile
    const profileRes = await request(app)
      .get('/api/v1/users/intelligence-profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.readinessRating).toBeGreaterThanOrEqual(70);
    expect(profileRes.body.verifiedSkills.length).toBeGreaterThan(0);

    // 11. Retrieve Empirical Analytics (Zero fabricated metrics)
    const analyticsRes = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.dataAvailable).toBe(true);
    expect(analyticsRes.body.questionsCompleted).toBe(1);
    expect(analyticsRes.body.averageScore).toBeGreaterThanOrEqual(70);
    expect(analyticsRes.body.codingTestPassRate).toBe(100);

    // 12. Personalized Preparation Roadmap
    const planRes = await request(app)
      .get('/api/v1/preparation/plan')
      .set('Authorization', `Bearer ${token}`);

    expect(planRes.status).toBe(200);
    expect(planRes.body.recommendations.length).toBeGreaterThan(0);
  });
});
