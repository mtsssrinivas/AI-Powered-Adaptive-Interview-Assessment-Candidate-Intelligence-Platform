import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Phase 13 — Payments and Credits System Test Suite', () => {
  const app = createApp();
  let authToken = '';

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jordan Pay',
        email: 'jordan.pay@interviewiq.ai',
        password: 'Password123!',
        targetRole: 'Full Stack Engineer',
      });
    authToken = regRes.body.token;
  });

  it('GET /api/v1/payments/plans should return available credit plans', async () => {
    const res = await request(app).get('/api/v1/payments/plans');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const starter = res.body.find((p: any) => p.id === 'STARTER');
    expect(starter).toBeDefined();
    expect(starter.credits).toBe(50);
  });

  it('GET /api/v1/credits/balance should return user welcome balance of 100 credits', async () => {
    const res = await request(app)
      .get('/api/v1/credits/balance')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.currentBalance).toBe(100);
  });

  it('POST /api/v1/payments/create-order should generate order for selected plan', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        planId: 'STARTER',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body.currency).toBe('INR');
    expect(res.body.plan.credits).toBe(50);
  });

  it('POST /api/v1/payments/verify should verify payment, add credits, and enforce idempotency', async () => {
    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ planId: 'STARTER' });

    const orderId = orderRes.body.orderId;
    const paymentId = `pay_${Date.now()}`;
    const signature = 'mock_valid_signature_for_tests';

    // First verification: should add 50 credits (100 -> 150)
    const verifyRes1 = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        planId: 'STARTER',
      });

    expect(verifyRes1.status).toBe(200);
    expect(verifyRes1.body.success).toBe(true);
    expect(verifyRes1.body.creditsAdded).toBe(50);
    expect(verifyRes1.body.newBalance).toBe(150);

    // Idempotent duplicate verification with exact same orderId: must NOT double credit
    const verifyRes2 = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        planId: 'STARTER',
      });

    expect(verifyRes2.status).toBe(200);
    expect(verifyRes2.body.newBalance).toBe(150); // Kept strictly at 150!
  });

  it('POST /api/v1/credits/deduct should deduct credits and reject when balance is insufficient', async () => {
    // Deduct 25 credits
    const deductRes = await request(app)
      .post('/api/v1/credits/deduct')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 25,
        reason: 'Mock Interview Session Initiation',
        referenceId: 'int_mock_session_123',
      });

    expect(deductRes.status).toBe(200);
    expect(deductRes.body.currentBalance).toBe(125);

    // Attempt to deduct more than balance
    const overdrawRes = await request(app)
      .post('/api/v1/credits/deduct')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 10000,
        reason: 'Excessive deduction attempt',
      });

    expect(overdrawRes.status).toBe(400);
    expect(overdrawRes.body.error).toMatch(/insufficient credits/i);
  });
});
