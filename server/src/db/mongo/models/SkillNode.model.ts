import mongoose, { Schema, Document } from 'mongoose';
import { CandidateSkillNode } from '@interviewiq/shared';

export interface ISkillNodeDocument extends Document, Omit<CandidateSkillNode, 'id'> {}

const SkillNodeSchema = new Schema<ISkillNodeDocument>(
  {
    userId: { type: String, required: true, index: true },
    skill: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: [
        'Programming Languages',
        'Frontend',
        'Backend',
        'Databases',
        'Cloud',
        'AI/ML',
        'DevOps',
        'CS Fundamentals',
        'Tools',
      ],
      required: true,
      index: true,
    },
    resumeEvidence: { type: [String], default: [] },
    assessmentEvidence: { type: [String], default: [] },
    proficiencyScore: { type: Number, min: 0, max: 100, default: null },
    proficiencyLevel: {
      type: String,
      enum: ['EXPOSURE_ONLY', 'NOVICE', 'INTERMEDIATE', 'PROFICIENT', 'EXPERT'],
      default: 'EXPOSURE_ONLY',
    },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    assessmentCount: { type: Number, default: 0, min: 0 },
    strengthTrend: {
      type: String,
      enum: ['IMPROVING', 'STABLE', 'DECLINING', 'UNASSESSED'],
      default: 'UNASSESSED',
    },
    lastAssessedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    bufferCommands: false,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

SkillNodeSchema.index({ userId: 1, skill: 1 }, { unique: true });

export const SkillNodeModel =
  mongoose.models.SkillNode || mongoose.model<ISkillNodeDocument>('SkillNode', SkillNodeSchema);
