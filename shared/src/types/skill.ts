import { z } from 'zod';
import { SkillCategorySchema } from './resume';

export const SkillProficiencyLevel = z.enum([
  'EXPOSURE_ONLY',
  'NOVICE',
  'INTERMEDIATE',
  'PROFICIENT',
  'EXPERT',
]);
export type SkillProficiencyLevel = z.infer<typeof SkillProficiencyLevel>;

export const StrengthTrendSchema = z.enum(['IMPROVING', 'STABLE', 'DECLINING', 'UNASSESSED']);
export type StrengthTrend = z.infer<typeof StrengthTrendSchema>;

export const CandidateSkillNodeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  skill: z.string(),
  category: SkillCategorySchema,
  resumeEvidence: z.array(z.string()).default([]),
  assessmentEvidence: z.array(z.string()).default([]),
  proficiencyScore: z.number().min(0).max(100).nullable().default(null),
  proficiencyLevel: SkillProficiencyLevel.default('EXPOSURE_ONLY'),
  confidence: z.number().min(0).max(1).default(0.5),
  assessmentCount: z.number().int().nonnegative().default(0),
  strengthTrend: StrengthTrendSchema.default('UNASSESSED'),
  lastAssessedAt: z.string().or(z.date()).nullable().default(null),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type CandidateSkillNode = z.infer<typeof CandidateSkillNodeSchema>;

export const CandidateSkillProfileSchema = z.object({
  userId: z.string(),
  totalSkillsTracked: z.number(),
  assessedSkillsCount: z.number(),
  unassessedSkillsCount: z.number(),
  topStrengths: z.array(CandidateSkillNodeSchema),
  topWeaknesses: z.array(CandidateSkillNodeSchema),
  categoryBreakdown: z.record(
    SkillCategorySchema,
    z.object({
      total: z.number(),
      assessed: z.number(),
      averageScore: z.number().nullable(),
      skills: z.array(CandidateSkillNodeSchema),
    })
  ),
});
export type CandidateSkillProfile = z.infer<typeof CandidateSkillProfileSchema>;
