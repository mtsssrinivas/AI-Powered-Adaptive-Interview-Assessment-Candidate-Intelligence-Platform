import { z } from 'zod';

export const PaymentStatusEnum = z.enum([
  'CREATED',
  'ATTEMPTED',
  'PAID',
  'FAILED',
  'REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const CreditTransactionTypeEnum = z.enum([
  'SIGNUP_BONUS',
  'PURCHASE',
  'INTERVIEW_DEDUCTION',
  'CODING_DEDUCTION',
  'REFUND',
  'ADMIN_ADJUSTMENT',
]);
export type CreditTransactionType = z.infer<typeof CreditTransactionTypeEnum>;

export const CreateOrderInputSchema = z.object({
  planId: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
  idempotencyKey: z.string().uuid().optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const VerifyPaymentInputSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  planId: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
  idempotencyKey: z.string().optional(),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

export const CreditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(), // positive for credits added, negative for deducted
  balanceAfter: z.number().nonnegative(),
  type: CreditTransactionTypeEnum,
  description: z.string(),
  referenceId: z.string().optional(), // orderId or interviewId
  createdAt: z.string().or(z.date()),
});
export type CreditTransaction = z.infer<typeof CreditTransactionSchema>;

export const CreditBalanceSchema = z.object({
  userId: z.string(),
  currentBalance: z.number().nonnegative(),
  totalEarned: z.number().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastUpdated: z.string().or(z.date()),
});
export type CreditBalance = z.infer<typeof CreditBalanceSchema>;
