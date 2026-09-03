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
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    })
  ),
  recommendedActionItems: z.array(z.string()),
  recommendedPreparationTopics: z.array(z.string()),
  generatedAt: z.string().or(z.date()),
});
export type InterviewReport = z.infer<typeof InterviewReportSchema>;

export const ProjectDefenseScoresSchema = z.object({
  ownershipAuthenticity: z.number().min(0).max(100),
  technicalDepth: z.number().min(0).max(100),
  architectureDecisionQuality: z.number().min(0).max(100),
  failureHandling: z.number().min(0).max(100),
  scalabilityAwareness: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
});
export type ProjectDefenseScores = z.infer<typeof ProjectDefenseScoresSchema>;

export const ProjectDefenseEvaluationSchema = z.object({
  id: z.string(),
  interviewId: z.string(),
  projectName: z.string(),
  scores: ProjectDefenseScoresSchema,
  authenticityVerdict: z.enum(['HIGH', 'MEDIUM', 'LOW', 'SUSPICIOUS']),
  demonstratedOwnershipDetails: z.array(z.string()),
  vulnerabilitiesDetected: z.array(z.string()),
  architecturalTradeoffsJustified: z.array(z.string()),
  executiveVerdictSummary: z.string(),
  createdAt: z.string().or(z.date()),
});
export type ProjectDefenseEvaluation = z.infer<typeof ProjectDefenseEvaluationSchema>;

export const CreateProjectDefenseInputSchema = z.object({
  projectName: z.string().min(2),
  projectDescription: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  claimedOutcomes: z.array(z.string()).default([]),
  durationMinutes: z.number().int().positive().default(30),
  questionCount: z.number().int().min(3).max(15).default(5),
});
export type CreateProjectDefenseInput = z.infer<typeof CreateProjectDefenseInputSchema>;
