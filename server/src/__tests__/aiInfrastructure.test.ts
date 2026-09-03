import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { AIOrchestrator } from '../ai/orchestrator';
import { QuestionSchema } from '@interviewiq/shared';

describe('Phase 14 — AI Infrastructure & Multi-Provider Layer Test Suite', () => {
  const app = createApp();

  it('GET /api/v1/ai/status should return operational provider status and prompt version map', async () => {
    const res = await request(app).get('/api/v1/ai/status');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeProvider');
    expect(res.body).toHaveProperty('fallbackProvider');
    expect(res.body.fallbackProvider).toBe('mock-deterministic');
    expect(res.body).toHaveProperty('defaultModel');
    expect(res.body).toHaveProperty('successRate');
    expect(res.body.successRate).toBeGreaterThanOrEqual(0);

    expect(res.body).toHaveProperty('promptVersions');
    expect(res.body.promptVersions).toHaveProperty('QUESTION_GENERATOR');
    expect(res.body.promptVersions.QUESTION_GENERATOR).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('GET /api/v1/ai/models should list multi-provider catalog with context windows and capability tags', async () => {
    const res = await request(app).get('/api/v1/ai/models');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const sonnet = res.body.find((m: any) => m.id.includes('claude-3.5-sonnet'));
    expect(sonnet).toBeDefined();
    expect(sonnet.contextWindow).toBeGreaterThanOrEqual(100000);
    expect(sonnet.recommendedFor).toContain('ANSWER_EVALUATOR');

    const gpt4o = res.body.find((m: any) => m.id.includes('gpt-4o'));
    expect(gpt4o).toBeDefined();
    expect(gpt4o.contextWindow).toBeGreaterThanOrEqual(100000);
  });

  it('AIOrchestrator.executeStructured should track token usage, latency, and log telemetry', async () => {
    const result = await AIOrchestrator.executeStructured(
      'QUESTION_GENERATOR',
      'You are an adaptive question generator',
      'Target role: Lead Platform Engineer. Candidate experience: LEAD.',
      QuestionSchema,
      'v1.0.0'
    );

    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('question');
    expect(result).toHaveProperty('latencyMs');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result).toHaveProperty('tokensUsed');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });
});
