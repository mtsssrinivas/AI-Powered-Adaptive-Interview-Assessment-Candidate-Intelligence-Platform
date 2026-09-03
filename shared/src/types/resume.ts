import { z } from 'zod';

export const SkillCategorySchema = z.enum([
  'Programming Languages',
  'Frontend',
  'Backend',
  'Databases',
  'Cloud',
  'AI/ML',
  'DevOps',
  'CS Fundamentals',
  'Tools',
]);
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const ExtractedSkillSchema = z.object({
  skill: z.string(),
  category: SkillCategorySchema,
  evidence: z.string(),
  source: z.literal('resume').default('resume'),
  confidence: z.number().min(0).max(1).default(1.0),
});
export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;

export const ExtractedProjectSchema = z.object({
  projectName: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  responsibilities: z.array(z.string()),
  claimedOutcomes: z.array(z.string()).default([]),
  technicalConcepts: z.array(z.string()).default([]),
  evidenceSnippet: z.string().optional(),
});
export type ExtractedProject = z.infer<typeof ExtractedProjectSchema>;

export const ExtractedExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  duration: z.string(),
  responsibilities: z.array(z.string()),
  technologies: z.array(z.string()),
});
export type ExtractedExperience = z.infer<typeof ExtractedExperienceSchema>;

export const ExtractedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  graduationYear: z.string().optional(),
  gpa: z.string().optional(),
});
export type ExtractedEducation = z.infer<typeof ExtractedEducationSchema>;

export const ParsedCandidateProfileSchema = z.object({
  candidateName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(ExtractedSkillSchema),
  projects: z.array(ExtractedProjectSchema),
  experience: z.array(ExtractedExperienceSchema),
  education: z.array(ExtractedEducationSchema),
  certifications: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
});
export type ParsedCandidateProfile = z.infer<typeof ParsedCandidateProfileSchema>;

export const ResumeStatusSchema = z.enum([
  'PENDING',
  'EXTRACTING_TEXT',
  'PARSING_LLM',
  'COMPLETED',
  'FAILED',
]);
export type ResumeStatus = z.infer<typeof ResumeStatusSchema>;

export const ResumeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  rawText: z.string().optional(),
  parsedProfile: ParsedCandidateProfileSchema.optional(),
  status: ResumeStatusSchema.default('PENDING'),
  errorMessage: z.string().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type Resume = z.infer<typeof ResumeSchema>;
