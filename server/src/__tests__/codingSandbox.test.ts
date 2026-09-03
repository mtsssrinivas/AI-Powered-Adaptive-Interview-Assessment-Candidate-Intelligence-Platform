import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 9 — DSA Coding Interview & Isolated Sandbox Test Suite', () => {
  const app = createApp();
  let authToken = '';
  let interviewId = '';

  beforeAll(async () => {
    // 1. Register candidate
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Casey Coder',
        email: 'casey.coder@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Senior Algorithms Engineer',
      });
    authToken = regRes.body.token;

    // 2. Create interview session
    const intRes = await request(app)
      .post('/api/v1/interviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        role: 'Senior Algorithms Engineer',
        interviewMode: 'DSA',
        experienceLevel: 'SENIOR',
        durationMinutes: 45,
        questionCount: 4,
      });
    interviewId = intRes.body.id;
  });

  it('GET /api/v1/coding/problems should return problems without exposing hidden test cases', async () => {
    const res = await request(app).get('/api/v1/coding/problems');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const twoSum = res.body.find((p: any) => p.id === 'prob-two-sum');
    expect(twoSum).toBeDefined();
    expect(twoSum).toHaveProperty('testCases');
    expect(twoSum.testCases.every((tc: any) => tc.isPublic)).toBe(true); // Hidden cases must remain hidden!
  });

  it('POST /api/v1/coding/run should execute optimal JavaScript code and return ACCEPTED', async () => {
    const optimalTwoSum = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const diff = target - nums[i];
          if (map.has(diff)) {
            return [map.get(diff), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const res = await request(app)
      .post('/api/v1/coding/run')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: optimalTwoSum,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.testCasesPassed).toBe(2);
    expect(res.body.totalTestCases).toBe(2);
    expect(res.body.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('POST /api/v1/coding/run should block malicious code trying to access host system', async () => {
    const maliciousCode = `
      const cp = require('child_process');
      cp.execSync('whoami');
      function twoSum() { return []; }
    `;

    const res = await request(app)
      .post('/api/v1/coding/run')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: maliciousCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RUNTIME_ERROR');
    expect(res.body.stderr).toMatch(/forbidden system or network token/i);
  });

  it('POST /api/v1/coding/run should handle infinite loops with TIME_LIMIT_EXCEEDED', async () => {
    const infiniteLoop = `
      function twoSum() {
        while (true) {}
        return [];
      }
    `;

    const res = await request(app)
      .post('/api/v1/coding/run')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: infiniteLoop,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TIME_LIMIT_EXCEEDED');
  });

  it('POST /api/v1/coding/submit should test hidden test cases and produce AI complexity evaluation', async () => {
    const solution = `
      function twoSum(nums, target) {
        const lookup = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (lookup.has(complement)) {
            return [lookup.get(complement), i];
          }
          lookup.set(nums[i], i);
        }
        return [];
      }
    `;

    const res = await request(app)
      .post('/api/v1/coding/submit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        interviewId,
        problemId: 'prob-two-sum',
        language: 'javascript',
        code: solution,
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.passedCount).toBe(4); // 2 sample + 2 hidden
    expect(res.body.totalCount).toBe(4);
    expect(res.body).toHaveProperty('aiEvaluation');

    const evalData = res.body.aiEvaluation;
    expect(evalData.timeComplexity).toBe('O(N)');
    expect(evalData.spaceComplexity).toBe('O(N)');
    expect(evalData.correctnessScore).toBe(100);
    expect(evalData.edgeCasesHandled.length).toBeGreaterThan(0);
  });
});
