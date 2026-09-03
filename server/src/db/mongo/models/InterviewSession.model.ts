import mongoose, { Schema, Document } from 'mongoose';
import { InterviewSession } from '@interviewiq/shared';

export interface IInterviewSessionDocument extends Document, Omit<InterviewSession, 'id'> {}

const InterviewSessionSchema = new Schema<IInterviewSessionDocument>(
  {
    userId: { type: String, required: true, index: true },
    resumeId: { type: String },
    role: { type: String, required: true },
    experienceLevel: {
      type: String,
      enum: ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'STAFF', 'LEAD'],
      required: true,
    },
    interviewMode: {
      type: String,
      enum: [
        'TECHNICAL',
        'BACKEND',
        'FRONTEND',
        'AIML',
        'DSA',
        'SYSTEM_DESIGN',
        'BEHAVIORAL',
        'PROJECT_DEFENSE',
        'FULL_INTERVIEW',
      ],
      required: true,
    },
    plan: { type: Schema.Types.Mixed, required: true },
    currentState: {
      type: String,
      enum: [
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
      ],
      default: 'PLANNED',
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0 },
    questions: [Schema.Types.Mixed],
    overallScore: { type: Number, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
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

export const InterviewSessionModel =
  mongoose.models.InterviewSession ||
  mongoose.model<IInterviewSessionDocument>('InterviewSession', InterviewSessionSchema);
