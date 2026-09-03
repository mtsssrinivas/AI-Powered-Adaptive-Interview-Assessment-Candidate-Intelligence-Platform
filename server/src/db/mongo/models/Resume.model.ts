import mongoose, { Schema, Document } from 'mongoose';
import { ParsedCandidateProfile } from '@interviewiq/shared';

export interface IResumeDocument extends Document {
  userId: string;
  fileName: string;
  fileSize: number;
  rawText?: string;
  parsedProfile?: ParsedCandidateProfile;
  status: 'PENDING' | 'EXTRACTING_TEXT' | 'PARSING_LLM' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    rawText: { type: String },
    parsedProfile: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['PENDING', 'EXTRACTING_TEXT', 'PARSING_LLM', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    errorMessage: { type: String },
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

export const ResumeModel =
  mongoose.models.Resume || mongoose.model<IResumeDocument>('Resume', ResumeSchema);
