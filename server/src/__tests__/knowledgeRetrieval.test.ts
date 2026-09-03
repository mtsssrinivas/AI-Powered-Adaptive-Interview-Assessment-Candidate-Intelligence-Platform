import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { RetrievalEngine } from '../modules/knowledge/retrieval.engine';

describe('Phase 15 — Interview Knowledge Retrieval (RAG) Test Suite', () => {
  const app = createApp();

  it('GET /api/v1/knowledge/topics should return categories with topic lists', async () => {
    const res = await request(app).get('/api/v1/knowledge/topics');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const sysDesign = res.body.find((c: any) => c.category === 'System Design');
    expect(sysDesign).toBeDefined();
    expect(sysDesign.topics.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/knowledge/search should perform semantic/keyword search over technical corpus', async () => {
    const res = await request(app)
      .get('/api/v1/knowledge/search')
      .query({ q: 'cache stampede redis mutex' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const firstResult = res.body[0];
    expect(firstResult.topic).toMatch(/caching|stampede/i);
    expect(firstResult.verifiedArchitectureRules.length).toBeGreaterThan(0);
    expect(firstResult.content).toMatch(/redis/i);
  });

  it('RetrievalEngine should rank top chunks and format ground-truth RAG context for prompts', () => {
    const retrieved = RetrievalEngine.retrieveContext(
      'Kafka consumer group lag and partition failover',
      'Backend',
      'Kafka',
      2
    );

    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0].chunk.skill).toBe('Kafka');
    expect(retrieved[0].relevanceScore).toBeGreaterThan(30);

    const formattedPrompt = RetrievalEngine.formatContextForPrompt(retrieved);
    expect(formattedPrompt).toContain('TECHNICAL REFERENCE KNOWLEDGE');
    expect(formattedPrompt).toContain('Verified Architecture Rules:');
    expect(formattedPrompt).toContain('Cooperative Sticky Assignor');
  });
});
