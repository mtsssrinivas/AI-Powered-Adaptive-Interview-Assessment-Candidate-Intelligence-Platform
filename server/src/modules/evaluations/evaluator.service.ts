import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  AnswerEvaluation,
  AnswerEvaluationSchema,
  InterviewSession,
  Question,
  SubmitAnswerInput,
} from '@interviewiq/shared';
import { EvaluationModel } from '../../db/mongo/models/Evaluation.model';
import { AIOrchestrator } from '../../ai/orchestrator';
import {
  EVALUATOR_PROMPT_VERSION,
  EVALUATOR_SYSTEM_PROMPT,
  buildEvaluatorUserPrompt,
} from '../../ai/prompts/evaluator.prompt';
import { AdaptiveEngineService } from '../interviews/adaptiveEngine.service';
import { SkillsService } from '../skills/skills.service';
import { queryPostgres, inMemoryStore } from '../../config/postgres';
import { logger } from '../../config/logger';

export const inMemoryEvaluationStore = new Map<string, AnswerEvaluation>();

export class EvaluatorService {
  static async evaluateAnswer(
    session: InterviewSession,
    question: Question,
    input: SubmitAnswerInput
  ): Promise<AnswerEvaluation> {
    const evalId = uuidv4();

    // 1. Execute 6-dimensional evaluation via AI Orchestrator
    const completion = await AIOrchestrator.executeStructured(
      'ANSWER_EVALUATOR',
      EVALUATOR_SYSTEM_PROMPT,
      buildEvaluatorUserPrompt({
        question: question.question,
        category: question.category,
        skill: question.skill,
        difficulty: question.difficulty,
        expectedConcepts: question.expectedConcepts,
        candidateAnswer: input.candidateAnswer,
        codeSnippet: input.codeSnippet,
      }),
      AnswerEvaluationSchema,
      EVALUATOR_PROMPT_VERSION,
      session.userId
    );

    const evaluatedData = completion.data;

    // 2. Compute dynamic adaptation decision
    const adaptiveDecision = AdaptiveEngineService.computeAdaptation(
      session,
      question,
      evaluatedData.scores,
      evaluatedData.missingConcepts
    );

    const evaluationEntity: AnswerEvaluation = {
      ...evaluatedData,
      id: evalId,
      interviewId: session.id,
      questionId: question.id,
      candidateAnswer: input.candidateAnswer,
      adaptiveDecision,
      confidence: evaluatedData.confidence ?? 0.9,
      evaluationPromptVersion: EVALUATOR_PROMPT_VERSION,
      evaluationLatencyMs: completion.latencyMs,
      tokensUsed: completion.tokensUsed,
      createdAt: new Date(),
    };

    // 3. Save to MongoDB if connected, and in-memory store
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = new EvaluationModel({
          _id: evalId,
          ...evaluationEntity,
        });
        await doc.save();
      } catch (err: any) {
        logger.warn('Failed saving evaluation to Mongo:', { error: err.message });
      }
    }

    inMemoryEvaluationStore.set(`${session.id}:${question.id}`, evaluationEntity);

    // 4. Record relational competency score in PostgreSQL
    await this.logCompetencyScore(
      session.userId,
      session.id,
      question.skill,
      evaluationEntity.scores.overallScore,
      evaluationEntity.evidence
    );

    // 5. Update Candidate Skill Graph
    await SkillsService.recordAssessmentResult(
      session.userId,
      question.skill,
      evaluationEntity.scores.overallScore,
      evaluationEntity.evidence
    ).catch((err) => {
      logger.warn('Failed updating skill graph with assessment:', { error: err.message });
    });

    return evaluationEntity;
  }

  static async getEvaluationsByInterview(interviewId: string): Promise<AnswerEvaluation[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await EvaluationModel.find({ interviewId }).sort({ createdAt: 1 });
        if (docs.length > 0) {
          return docs.map((d) => d.toJSON() as AnswerEvaluation);
        }
      } catch {
        // Mongo fallback
      }
    }

    return Array.from(inMemoryEvaluationStore.values()).filter(
      (e) => e.interviewId === interviewId
    );
  }

  private static async logCompetencyScore(
    userId: string,
    interviewId: string,
    competency: string,
    score: number,
    evidence: string
  ): Promise<void> {
    const scoreId = uuidv4();
    try {
      await queryPostgres(
        `INSERT INTO competency_scores (id, user_id, interview_id, competency, score, evidence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [scoreId, userId, interviewId, competency, score, evidence]
      );
    } catch {
      const table = inMemoryStore.getTable('competency_scores');
      table.set(scoreId, {
        id: scoreId,
        userId,
        interviewId,
        competency,
        score,
        evidence,
        createdAt: new Date(),
      });
    }
  }
}
