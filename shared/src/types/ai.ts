import { z } from 'zod';

export const AIProviderNameSchema = z.enum(['openrouter', 'mock']);
export type AIProviderName = z.infer<typeof AIProviderNameSchema>;

export const AIRequestMetadataSchema = z.object({
  id: z.string(),
  capability: z.enum([
    'RESUME_PARSER',
    'INTERVIEW_PLANNER',
    'QUESTION_GENERATOR',
    'ANSWER_EVALUATOR',
    'ADAPTIVE_DECISION',
    'PROJECT_DEFENSE',
    'REPORT_GENERATOR',
    'PREPARATION_RECOMMENDER',
  ]),
  provider: AIProviderNameSchema,
  model: z.string(),
  promptVersion: z.string(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  latencyMs: z.number(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  createdAt: z.string().or(z.date()),
});
export type AIRequestMetadata = z.infer<typeof AIRequestMetadataSchema>;

export const AIMetricsSummarySchema = z.object({
  totalRequests: z.number().int().nonnegative(),
  successfulRequests: z.number().int().nonnegative(),
  failedRequests: z.number().int().nonnegative(),
  averageLatencyMs: z.number().nonnegative(),
  totalTokensUsed: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative(),
});
export type AIMetricsSummary = z.infer<typeof AIMetricsSummarySchema>;
