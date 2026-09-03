import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { InterviewSessionModel } from '../../db/mongo/models/InterviewSession.model';
import { InterviewPlannerService } from './planner.service';
import { InterviewStateMachine } from './interviewStateMachine';
import {
  CreateInterviewInput,
  InterviewSession,
  InterviewState,
  SubmitAnswerInput,
  AnswerEvaluation,
} from '@interviewiq/shared';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../config/logger';
import { EvaluatorService, inMemoryEvaluationStore } from '../evaluations/evaluator.service';

export const inMemoryInterviewStore = new Map<string, InterviewSession>();

export class InterviewsService {
  static async createInterview(
    userId: string,
    input: CreateInterviewInput
  ): Promise<InterviewSession> {
    const interviewId = uuidv4();

    // 1. Generate adaptive interview plan
    const plan = await InterviewPlannerService.generatePlan(userId, input);

    // 2. Assemble Interview Session
    const session: InterviewSession = {
      id: interviewId,
      userId,
      resumeId: input.resumeId,
      role: input.role,
      experienceLevel: input.experienceLevel,
      interviewMode: input.interviewMode,
      plan,
      currentState: 'PLANNED',
      currentQuestionIndex: 0,
      questions: [],
      overallScore: null,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = new InterviewSessionModel({
          _id: interviewId,
          ...session,
        });
        await doc.save();
      } catch (err: any) {
        logger.warn('Failed saving interview session to MongoDB:', { error: err.message });
      }
    }

    inMemoryInterviewStore.set(interviewId, session);

    return session;
  }

  static async getInterviewById(interviewId: string): Promise<InterviewSession> {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await InterviewSessionModel.findById(interviewId);
        if (doc) return doc.toJSON() as InterviewSession;
      } catch {
        // Mongo fallback
      }
    }

    const cached = inMemoryInterviewStore.get(interviewId);
    if (!cached) {
      throw new NotFoundError('Interview session not found');
    }
    return cached;
  }

  static async getInterviewsByUser(userId: string): Promise<InterviewSession[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await InterviewSessionModel.find({ userId }).sort({ createdAt: -1 });
        if (docs.length > 0) {
          return docs.map((d) => d.toJSON() as InterviewSession);
        }
      } catch {
        // Mongo fallback
      }
    }

    return Array.from(inMemoryInterviewStore.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async transitionState(
    interviewId: string,
    nextState: InterviewState
  ): Promise<InterviewSession> {
    const session = await this.getInterviewById(interviewId);

    // Enforce state machine rules
    InterviewStateMachine.assertValidTransition(session.currentState, nextState);

    session.currentState = nextState;
    session.updatedAt = new Date();
    if (nextState === 'COMPLETED') {
      session.completedAt = new Date();
    }

    inMemoryInterviewStore.set(interviewId, session);

    if (mongoose.connection.readyState === 1) {
      try {
        await InterviewSessionModel.findByIdAndUpdate(interviewId, {
          $set: {
            currentState: nextState,
            updatedAt: session.updatedAt,
            completedAt: session.completedAt,
          },
        });
      } catch (err: any) {
        logger.warn('Failed updating session state in Mongo:', { error: err.message });
      }
    }

    return session;
  }

  static async submitAnswer(
    interviewId: string,
    input: SubmitAnswerInput
  ): Promise<{ evaluation: AnswerEvaluation; session: InterviewSession }> {
    const session = await this.getInterviewById(interviewId);

    if (session.currentState !== 'QUESTION_ACTIVE') {
      throw new ValidationError(`Cannot submit answer when interview state is '${session.currentState}'`);
    }

    const question = session.questions.find((q) => q.id === input.questionId);
    if (!question) {
      throw new NotFoundError('Question not found in this interview session');
    }

    // Duplicate submission guard
    const evalKey = `${interviewId}:${input.questionId}`;
    if (inMemoryEvaluationStore.has(evalKey)) {
      throw new ValidationError('This question has already been answered and evaluated');
    }

    // State transition 1: ANSWER_SUBMITTED
    await this.transitionState(interviewId, 'ANSWER_SUBMITTED');

    // Evaluate answer across 6 dimensions
    const evaluation = await EvaluatorService.evaluateAnswer(session, question, input);

    // State transition 2: ANSWER_EVALUATED
    await this.transitionState(interviewId, 'ANSWER_EVALUATED');

    // Check if session has reached question target
    const isCompleted = session.questions.length >= session.plan.totalQuestionTarget;
    if (isCompleted) {
      await this.transitionState(interviewId, 'COMPLETED');
    } else {
      await this.transitionState(interviewId, 'NEXT_QUESTION');
    }

    return { evaluation, session };
  }
}
