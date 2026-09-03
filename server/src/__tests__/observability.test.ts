import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 19 — Observability & Performance Metrics Test Suite', () => {
  const app = createApp();

  it('GET /api/v1/metrics should return comprehensive JSON system and HTTP metrics', async () => {
    // Generate a couple of requests first
    await request(app).get('/api/v1/health');
    await request(app).get('/api/v1/ready');

    const res = await request(app).get('/api/v1/metrics');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('memoryUsageMb');
    expect(res.body.system.memoryUsageMb.heapUsed).toBeGreaterThan(0);
    expect(res.body.system).toHaveProperty('uptimeSeconds');

    expect(res.body).toHaveProperty('http');
    expect(res.body.http.totalRequests).toBeGreaterThanOrEqual(2);
    expect(res.body.http.status2xx).toBeGreaterThanOrEqual(2);
    expect(res.body.http).toHaveProperty('globalP50Ms');
    expect(res.body.http).toHaveProperty('globalP95Ms');
    expect(res.body.http).toHaveProperty('globalP99Ms');
  });

  it('GET /api/v1/metrics with text/plain should return Prometheus exposition format', async () => {
    const res = await request(app)
      .get('/api/v1/metrics')
      .set('Accept', 'text/plain');

    expect(res.status).toBe(200);
    expect(res.text).toContain('interviewiq_http_requests_total');
    expect(res.text).toContain('interviewiq_process_heap_used_bytes');
    expect(res.text).toContain('interviewiq_uptime_seconds');
  });

  it('All endpoints should attach x-request-id correlation tracking headers', async () => {
    const customCorrelationId = 'custom-trace-uuid-12345';
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', customCorrelationId);

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe(customCorrelationId);
  });
});
