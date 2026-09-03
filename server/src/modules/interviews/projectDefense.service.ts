import { v4 as uuidv4 } from 'uuid';
import {
  CreateProjectDefenseInput,
  InterviewSession,
  ProjectDefenseEvaluation,
  ProjectDefenseScores,
} from '@interviewiq/shared';
import { InterviewsService } from './interviews.service';
import { EvaluatorService } from '../evaluations/evaluator.service';
import { QuestionsService } from '../questions/questions.service';
import { NotFoundError, ValidationError } from '../../utils/errors';

export const inMemoryDefenseStore = new Map<string, ProjectDefenseEvaluation>();

export class ProjectDefenseService {
  static async startProjectDefense(
    userId: string,
    input: CreateProjectDefenseInput
  ): Promise<{ session: InterviewSession; firstQuestion: any }> {
    // 1. Create interview session configured for project defense
    const session = await InterviewsService.createInterview(userId, {
      role: `Project Defense: ${input.projectName}`,
      interviewMode: 'PROJECT_DEFENSE',
      experienceLevel: 'SENIOR',
      durationMinutes: input.durationMinutes || 30,
      questionCount: input.questionCount || 5,
      selectedSkills: input.technologies.length > 0 ? input.technologies : ['System Architecture', 'Fault Tolerance'],
      customWeights: [
        { category: 'System Design', percentage: 50 },
        { category: 'Databases', percentage: 25 },
        { category: 'DevOps', percentage: 25 },
      ],
    });

    // 2. Generate initial architectural interrogation question
    const firstQuestion = await QuestionsService.generateNextQuestion(session.id, {
      difficulty: 'HARD',
      skill: input.technologies[0] || 'System Architecture',
      questionType: 'PROJECT_DEFENSE',
      reason: `Adversarial project defense for ${input.projectName}`,
    });

    return { session, firstQuestion };
  }

  static async computeProjectDefenseVerdict(
    interviewId: string
  ): Promise<ProjectDefenseEvaluation> {
    const session = await InterviewsService.getInterviewById(interviewId);
    const evaluations = await EvaluatorService.getEvaluationsByInterview(interviewId);

    if (evaluations.length === 0) {
      throw new ValidationError('Cannot generate project defense verdict with zero evaluated answers.');
    }

    // Aggregate 5 defense dimensions
    const avg = (fn: (e: any) => number) =>
      Math.round(evaluations.reduce((acc, curr) => acc + fn(curr), 0) / evaluations.length);

    const scores: ProjectDefenseScores = {
      ownershipAuthenticity: avg((e) => e.scores.problemSolving),
      technicalDepth: avg((e) => e.scores.depth),
      architectureDecisionQuality: avg((e) => e.scores.technicalCorrectness),
      failureHandling: avg((e) => e.scores.completeness),
      scalabilityAwareness: avg((e) => e.scores.relevance),
      overallScore: avg((e) => e.scores.overallScore),
    };

    let authenticityVerdict: 'HIGH' | 'MEDIUM' | 'LOW' | 'SUSPICIOUS' = 'MEDIUM';
    if (scores.overallScore >= 80 && scores.ownershipAuthenticity >= 75) {
      authenticityVerdict = 'HIGH';
    } else if (scores.overallScore >= 60) {
      authenticityVerdict = 'MEDIUM';
    } else if (scores.overallScore >= 40) {
      authenticityVerdict = 'LOW';
    } else {
      authenticityVerdict = 'SUSPICIOUS';
    }

    const demonstratedOwnershipDetails: string[] = [];
    const vulnerabilitiesDetected: string[] = [];
    const architecturalTradeoffsJustified: string[] = [];

    for (const ev of evaluations) {
      demonstratedOwnershipDetails.push(...ev.strengths);
      vulnerabilitiesDetected.push(...ev.weaknesses);
      if (ev.missingConcepts) {
        architecturalTradeoffsJustified.push(...ev.missingConcepts);
      }
    }

    const defenseId = uuidv4();
    const defenseResult: ProjectDefenseEvaluation = {
      id: defenseId,
      interviewId,
      projectName: session.role.replace('Project Defense: ', ''),
      scores,
      authenticityVerdict,
      demonstratedOwnershipDetails: Array.from(new Set(demonstratedOwnershipDetails)).slice(0, 5),
      vulnerabilitiesDetected: Array.from(new Set(vulnerabilitiesDetected)).slice(0, 5),
      architecturalTradeoffsJustified: Array.from(new Set(architecturalTradeoffsJustified)).slice(0, 5),
      executiveVerdictSummary: `Candidate demonstrated ${authenticityVerdict} ownership authenticity with an overall defense score of ${scores.overallScore}%. Technical depth reached ${scores.technicalDepth}%.`,
      createdAt: new Date(),
    };

    inMemoryDefenseStore.set(interviewId, defenseResult);
    return defenseResult;
  }

  static async getProjectDefense(interviewId: string): Promise<ProjectDefenseEvaluation> {
    const cached = inMemoryDefenseStore.get(interviewId);
    if (cached) return cached;

    // Compute dynamically if evaluations exist
    return this.computeProjectDefenseVerdict(interviewId);
  }
}
