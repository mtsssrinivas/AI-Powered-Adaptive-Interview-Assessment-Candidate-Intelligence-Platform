import { z } from 'zod';

export const HistoricalTrendPointSchema = z.object({
  interviewId: z.string(),
  date: z.string(),
  role: z.string(),
  mode: z.string(),
  score: z.number().min(0).max(100),
  technicalCorrectness: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
});
export type HistoricalTrendPoint = z.infer<typeof HistoricalTrendPointSchema>;

export const CompetencySummarySchema = z.object({
  competency: z.string(),
  averageScore: z.number().min(0).max(100).nullable(),
  evaluationsCount: z.number().int().nonnegative(),
  trend: z.enum(['IMPROVING', 'STABLE', 'DECLINING', 'NOT_EVALUATED']),
});
export type CompetencySummary = z.infer<typeof CompetencySummarySchema>;

export const AnalyticsOverviewSchema = z.object({
  overallReadiness: z.number().min(0).max(100).nullable(),
  technicalCorrectness: z.number().min(0).max(100).nullable(),
  communication: z.number().min(0).max(100).nullable(),
  problemSolving: z.number().min(0).max(100).nullable(),
  systemDesign: z.number().min(0).max(100).nullable(),
  dsa: z.number().min(0).max(100).nullable(),
  interviewsCompleted: z.number().int().nonnegative(),
  questionsCompleted: z.number().int().nonnegative(),
  averageScore: z.number().min(0).max(100).nullable(),
  codingTestPassRate: z.number().min(0).max(100).nullable(),
  totalPracticeTimeMinutes: z.number().int().nonnegative(),
  competencyBreakdown: z.array(CompetencySummarySchema),
  recentTrends: z.array(HistoricalTrendPointSchema),
  strongestCompetency: z.string().nullable(),
  weakestCompetency: z.string().nullable(),
  dataAvailable: z.boolean(),
});
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;

export const PreparationRecommendationSchema = z.object({
  priority: z.number().int(),
  category: z.string(),
  topic: z.string(),
  reason: z.string(),
  recommendedAction: z.string(),
  estimatedHours: z.number(),
  completed: z.boolean().default(false),
});
export type PreparationRecommendation = z.infer<typeof PreparationRecommendationSchema>;

export const PreparationPlanSchema = z.object({
  userId: z.string(),
  generatedAt: z.string().or(z.date()),
  targetRole: z.string(),
  recommendations: z.array(PreparationRecommendationSchema),
  readinessGap: z.number().min(0).max(100),
});
export type PreparationPlan = z.infer<typeof PreparationPlanSchema>;
