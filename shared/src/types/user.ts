import { z } from 'zod';

export const ExperienceLevelSchema = z.enum([
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'STAFF',
  'LEAD',
]);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const InterviewTypeEnum = z.enum([
  'TECHNICAL',
  'BACKEND',
  'FRONTEND',
  'AIML',
  'DSA',
  'SYSTEM_DESIGN',
  'BEHAVIORAL',
  'PROJECT_DEFENSE',
  'FULL_INTERVIEW',
]);
export type InterviewType = z.infer<typeof InterviewTypeEnum>;

export const UserRoleSchema = z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  avatar: z.string().optional(),
  targetRole: z.string().default('Full Stack Engineer'),
  experienceLevel: ExperienceLevelSchema.default('MID'),
  preferredInterviewTypes: z.array(InterviewTypeEnum).default(['TECHNICAL', 'SYSTEM_DESIGN']),
  creditBalance: z.number().nonnegative().default(100),
  role: UserRoleSchema.default('CANDIDATE'),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type User = z.infer<typeof UserSchema>;

export const RegisterInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  targetRole: z.string().optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
