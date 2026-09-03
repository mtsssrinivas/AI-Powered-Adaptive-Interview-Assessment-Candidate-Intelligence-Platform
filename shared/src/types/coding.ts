import { z } from 'zod';
import { DifficultyLevelEnum } from './interview';

export const SupportedLanguageEnum = z.enum([
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'go',
]);
export type SupportedLanguage = z.infer<typeof SupportedLanguageEnum>;

export const ExecutionStatusEnum = z.enum([
  'PENDING',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'COMPILATION_ERROR',
  'SYSTEM_ERROR',
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusEnum>;

export const TestCaseSchema = z.object({
  id: z.string(),
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(true),
  explanation: z.string().optional(),
});
export type TestCase = z.infer<typeof TestCaseSchema>;

export const CodingProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  difficulty: DifficultyLevelEnum,
  category: z.string(),
  description: z.string(),
  constraints: z.array(z.string()).default([]),
  starterCode: z.record(SupportedLanguageEnum, z.string()),
  testCases: z.array(TestCaseSchema),
  timeLimitMs: z.number().default(2000),
  memoryLimitMb: z.number().default(128),
});
export type CodingProblem = z.infer<typeof CodingProblemSchema>;

export const TestCaseResultSchema = z.object({
  testCaseId: z.string(),
  passed: z.boolean(),
  actualOutput: z.string().optional(),
  expectedOutput: z.string().optional(),
  executionTimeMs: z.number(),
  memoryUsedKb: z.number().optional(),
  errorMessage: z.string().optional(),
  isPublic: z.boolean(),
});
export type TestCaseResult = z.infer<typeof TestCaseResultSchema>;

export const CodingSubmissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  problemId: z.string(),
  interviewId: z.string().optional(),
  language: SupportedLanguageEnum,
  code: z.string(),
  status: ExecutionStatusEnum,
  passRate: z.number().min(0).max(100),
  passedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  runtimeMs: z.number(),
  memoryKb: z.number(),
  results: z.array(TestCaseResultSchema).default([]),
  aiEvaluation: z.record(z.any()).optional(),
  compileError: z.string().optional(),
  createdAt: z.string().or(z.date()),
});
export type CodingSubmission = z.infer<typeof CodingSubmissionSchema>;

export const RunCodeInputSchema = z.object({
  problemId: z.string(),
  language: SupportedLanguageEnum,
  code: z.string().min(1, 'Code cannot be empty'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

export const SubmitCodeInputSchema = z.object({
  problemId: z.string(),
  language: SupportedLanguageEnum,
  code: z.string().min(1, 'Code cannot be empty'),
  interviewId: z.string().optional(),
});
export type SubmitCodeInput = z.infer<typeof SubmitCodeInputSchema>;
