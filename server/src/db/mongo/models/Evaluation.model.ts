import mongoose, { Schema, Document } from 'mongoose';
import { AnswerEvaluation } from '@interviewiq/shared';

export interface IEvaluationDocument extends Document, Omit<AnswerEvaluation, 'id'> {}

const EvaluationSchema = new Schema<IEvaluationDocument>(
  {
    interviewId: { type: String, required: true, index: true },
    questionId: { type: String, required: true, index: true },
    candidateAnswer: { type: String, required: true },
    scores: {
      technicalCorrectness: { type: Number, required: true },
      relevance: { type: Number, required: true },
      depth: { type: Number, required: true },
      problemSolving: { type: Number, required: true },
      communication: { type: Number, required: true },
      completeness: { type: Number, required: true },
      overallScore: { type: Number, required: true },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    evidence: { type: String, required: true },
    recommendedFollowUp: { type: String },
    confidence: { type: Number, default: 0.9 },
    adaptiveDecision: { type: Schema.Types.Mixed },
    evaluationPromptVersion: { type: String, default: 'v1.0.0' },
    evaluationLatencyMs: { type: Number },
    tokensUsed: { type: Number },
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

EvaluationSchema.index({ interviewId: 1, questionId: 1 }, { unique: true });

export const EvaluationModel =
  mongoose.models.Evaluation || mongoose.model<IEvaluationDocument>('Evaluation', EvaluationSchema);
