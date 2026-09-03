import { z } from 'zod';
import { InterviewTypeEnum, ExperienceLevelSchema } from './user';

export const InterviewStateEnum = z.enum([
  'CREATED',
  'RESUME_ANALYZED',
  'PLANNED',
  'QUESTION_ACTIVE',
  'ANSWER_SUBMITTED',
  'ANSWER_EVALUATED',
  'FOLLOWUP_DECISION',
  'NEXT_QUESTION',
  'COMPLETED',
  'REPORT_GENERATED',
]);
export type InterviewState = z.infer<typeof InterviewStateEnum>;

export const QuestionTypeEnum = z.enum([
  'CONCEPTUAL',
  'SCENARIO',
  'SYSTEM_DESIGN',
  'PROJECT_DEFENSE',
  'BEHAVIORAL',
  'CODING',
  'DEBUGGING',
  'TRADEOFF',
  'FOLLOW_UP',
]);
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const DifficultyLevelEnum = z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']);
export type DifficultyLevel = z.infer<typeof DifficultyLevelEnum>;

export const InterviewPlanCompetencyWeightSchema = z.object({
  category: z.string(),
  percentage: z.number().min(0).max(100),
});
export type InterviewPlanCompetencyWeight = z.infer<typeof InterviewPlanCompetencyWeightSchema>;

export const InterviewPlanSchema = z.object({
  targetRole: z.string(),
  experienceLevel: ExperienceLevelSchema,
  interviewMode: InterviewTypeEnum,
  estimatedDurationMinutes: z.number().positive(),
  totalQuestionTarget: z.number().int().positive(),
  competencyWeights: z.array(InterviewPlanCompetencyWeightSchema),
  targetSkills: z.array(z.string()),
  codingEnabled: z.boolean().default(false),
  behavioralEnabled: z.boolean().default(true),
  projectDefenseEnabled: z.boolean().default(true),
});
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const AdaptiveDecisionSchema = z.object({
  nextDifficulty: DifficultyLevelEnum,
  nextSkill: z.string(),
  questionType: QuestionTypeEnum,
  reason: z.string(),
  followUp: z.boolean(),
  focusArea: z.string().optional(),
});
export type AdaptiveDecision = z.infer<typeof AdaptiveDecisionSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  interviewId: z.string(),
  orderIndex: z.number().int().nonnegative(),
  question: z.string(),
  category: z.string(),
  skill: z.string(),
  difficulty: DifficultyLevelEnum,
  expectedConcepts: z.array(z.string()),
  questionType: QuestionTypeEnum,
  source: z.enum(['PLAN', 'RESUME_PROJECT', 'ADAPTIVE_FOLLOWUP', 'DIAGNOSTIC']),
  resumeEvidenceCited: z.string().optional(),
  followUpPotential: z.boolean().default(true),
  starterCode: z.string().optional(),
  language: z.string().optional(),
  timeLimitSeconds: z.number().optional(),
  promptVersion: z.string().default('v1.0.0'),
  createdAt: z.string().or(z.date()),
});
export type Question = z.infer<typeof QuestionSchema>;

export const CreateInterviewInputSchema = z.object({
  role: z.string().min(2),
  experienceLevel: ExperienceLevelSchema,
  interviewMode: InterviewTypeEnum,
  resumeId: z.string().optional(),
  selectedSkills: z.array(z.string()).default([]),
  durationMinutes: z.number().int().positive().default(30),
  questionCount: z.number().int().min(3).max(25).default(6),
  customWeights: z.array(InterviewPlanCompetencyWeightSchema).optional(),
});
export type CreateInterviewInput = z.infer<typeof CreateInterviewInputSchema>;

export const InterviewSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resumeId: z.string().optional(),
  role: z.string(),
  experienceLevel: ExperienceLevelSchema,
  interviewMode: InterviewTypeEnum,
  plan: InterviewPlanSchema,
  currentState: InterviewStateEnum,
  currentQuestionIndex: z.number().int().default(0),
  questions: z.array(QuestionSchema).default([]),
  overallScore: z.number().min(0).max(100).nullable().default(null),
  startedAt: z.string().or(z.date()).optional(),
  completedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;
