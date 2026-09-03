import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Health & Observability APIs', () => {
  const app = createApp();

  it('GET /api/v1/health should return real service status and telemetry', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'InterviewIQ API');
    expect(res.body).toHaveProperty('version', '2.0.0');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('memoryUsageMb');
    expect(res.body).toHaveProperty('infrastructure');
    expect(res.body.infrastructure).toHaveProperty('mongodb');
    expect(res.body.infrastructure).toHaveProperty('postgresql');
    expect(res.body.infrastructure).toHaveProperty('redis');
  });

  it('GET /api/v1/ready should return readiness probe response', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ready', true);
  });

  it('GET /api/v1/non-existent should return structured 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });
});
