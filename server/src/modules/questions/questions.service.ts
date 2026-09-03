import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  DifficultyLevel,
  Question,
  QuestionSchema,
  QuestionType,
} from '@interviewiq/shared';
import { InterviewsService } from '../interviews/interviews.service';
import { InterviewStateMachine } from '../interviews/interviewStateMachine';
import { AIOrchestrator } from '../../ai/orchestrator';
import {
  QUESTION_GENERATOR_PROMPT_VERSION,
  QUESTION_GENERATOR_SYSTEM_PROMPT,
  buildQuestionGeneratorUserPrompt,
} from '../../ai/prompts/questionGenerator.prompt';
import { ResumesService } from '../resumes/resumes.service';
import { RetrievalEngine } from '../knowledge/retrieval.engine';
import { InterviewSessionModel } from '../../db/mongo/models/InterviewSession.model';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../config/logger';

export class QuestionsService {
  static async generateNextQuestion(
    interviewId: string,
    adaptiveOverride?: {
      difficulty?: DifficultyLevel;
      skill?: string;
      questionType?: QuestionType;
      reason?: string;
    }
  ): Promise<Question> {
    const session = await InterviewsService.getInterviewById(interviewId);

    if (session.currentState === 'COMPLETED' || session.currentState === 'REPORT_GENERATED') {
      throw new ValidationError('Interview session is already completed');
    }

    const currentCount = session.questions.length;
    if (currentCount >= session.plan.totalQuestionTarget) {
      // Reached target question count, complete session
      await InterviewsService.transitionState(interviewId, 'COMPLETED');
      throw new ValidationError('Interview question limit reached. Session ready for report generation.');
    }

    // Determine category & skill from session plan or adaptive override
    const weights = session.plan.competencyWeights;
    const catIndex = currentCount % weights.length;
    const targetCategory = weights[catIndex]?.category || 'Backend';

    const targetSkill =
      adaptiveOverride?.skill ||
      session.plan.targetSkills[currentCount % session.plan.targetSkills.length] ||
      'Node.js';

    const difficulty: DifficultyLevel =
      adaptiveOverride?.difficulty ||
      (session.experienceLevel === 'ENTRY'
        ? 'EASY'
        : session.experienceLevel === 'SENIOR' || session.experienceLevel === 'STAFF'
        ? 'HARD'
        : 'MEDIUM');

    const questionType: QuestionType =
      adaptiveOverride?.questionType ||
      (session.interviewMode === 'SYSTEM_DESIGN'
        ? 'SYSTEM_DESIGN'
        : session.interviewMode === 'DSA'
        ? 'CODING'
        : currentCount % 2 === 0
        ? 'SCENARIO'
        : 'CONCEPTUAL');

    // Retrieve project evidence if available
    let projectEvidence: string | undefined;
    try {
      const projects = await ResumesService.getExtractedProjectsByUser(session.userId);
      if (projects.length > 0) {
        const matching = projects.find((p) =>
          p.technologies.some((t) => t.toLowerCase().includes(targetSkill.toLowerCase()))
        );
        projectEvidence = matching?.evidenceSnippet || matching?.description || projects[0]?.description;
      }
    } catch {
      // ignore
    }

    const previousQuestions = session.questions.map((q) => q.question);

    // Retrieve verified architectural reference knowledge via RAG
    const retrieved = RetrievalEngine.retrieveContext(
      `${session.role} ${targetSkill} ${targetCategory}`,
      targetCategory,
      targetSkill,
      2
    );
    const ragContext = RetrievalEngine.formatContextForPrompt(retrieved);

    // Call AI Orchestrator
    const completion = await AIOrchestrator.executeStructured(
      'QUESTION_GENERATOR',
      `${QUESTION_GENERATOR_SYSTEM_PROMPT}\n${ragContext}`,
      buildQuestionGeneratorUserPrompt({
        role: session.role,
        interviewMode: session.interviewMode,
        skill: targetSkill,
        category: targetCategory,
        difficulty,
        questionType,
        orderIndex: currentCount,
        projectEvidence,
        previousQuestions,
        candidateExperienceLevel: session.experienceLevel,
      }),
      QuestionSchema,
      QUESTION_GENERATOR_PROMPT_VERSION,
      session.userId
    );

    const questionId = uuidv4();
    const newQuestion: Question = {
      ...completion.data,
      id: questionId,
      interviewId,
      orderIndex: currentCount,
      category: targetCategory,
      skill: targetSkill,
      difficulty,
      questionType,
      source: projectEvidence ? 'RESUME_PROJECT' : 'PLAN',
      resumeEvidenceCited: projectEvidence,
      followUpPotential: completion.data.followUpPotential ?? true,
      promptVersion: completion.data.promptVersion || QUESTION_GENERATOR_PROMPT_VERSION,
      createdAt: new Date(),
    };

    // Update session questions and state
    session.questions.push(newQuestion);
    session.currentQuestionIndex = currentCount;
    session.currentState = 'QUESTION_ACTIVE';
    session.updatedAt = new Date();

    if (mongoose.connection.readyState === 1) {
      try {
        await InterviewSessionModel.findByIdAndUpdate(interviewId, {
          $push: { questions: newQuestion },
          $set: {
            currentQuestionIndex: session.currentQuestionIndex,
            currentState: 'QUESTION_ACTIVE',
            updatedAt: session.updatedAt,
          },
        });
      } catch (err: any) {
        logger.warn('Failed updating session with question in Mongo:', { error: err.message });
      }
    }

    return newQuestion;
  }
}
