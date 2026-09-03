import { z } from 'zod';
import { AdaptiveDecisionSchema } from './interview';

export const EvaluationScoresSchema = z.object({
  technicalCorrectness: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
});
export type EvaluationScores = z.infer<typeof EvaluationScoresSchema>;

export const AnswerEvaluationSchema = z.object({
  id: z.string(),
  interviewId: z.string(),
  questionId: z.string(),
  candidateAnswer: z.string(),
  scores: EvaluationScoresSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  evidence: z.string(),
  recommendedFollowUp: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.9),
  adaptiveDecision: AdaptiveDecisionSchema.optional(),
  evaluationPromptVersion: z.string().default('v1.0.0'),
  evaluationLatencyMs: z.number().optional(),
  tokensUsed: z.number().optional(),
  createdAt: z.string().or(z.date()),
});
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;

export const SubmitAnswerInputSchema = z.object({
  questionId: z.string(),
  candidateAnswer: z.string().min(1, 'Answer cannot be empty'),
  codeSnippet: z.string().optional(),
  codeLanguage: z.string().optional(),
  durationSeconds: z.number().nonnegative().optional(),
});
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerInputSchema>;

export const InterviewReportSchema = z.object({
  interviewId: z.string(),
  userId: z.string(),
  role: z.string(),
  overallReadiness: z.number().min(0).max(100),
  executiveSummary: z.string(),
  dimensionAverages: EvaluationScoresSchema,
  keyStrengths: z.array(z.string()),
  criticalWeaknesses: z.array(z.string()),
  questionBreakdown: z.array(
    z.object({
      questionText: z.string(),
      category: z.string(),
      skill: z.string(),
      candidateAnswer: z.string(),
      scores: EvaluationScoresSchema,
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      missingConcepts: z.array(z.string()),
      evidence: z.string(),
    })
  ),
  recommendedPreparationPlan: z.array(
    z.object({
      priority: z.number().int(),
      topic: z.string(),
      reason: z.string(),
      actionableAdvice: z.string(),
    })
  ),
  generatedAt: z.string().or(z.date()),
});
export type InterviewReport = z.infer<typeof InterviewReportSchema>;
