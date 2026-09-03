import { PreparationPlan, PreparationPlanSchema } from '@interviewiq/shared';
import { AIOrchestrator } from '../../ai/orchestrator';
import {
  PREPARATION_PLANNER_PROMPT_VERSION,
  PREPARATION_PLANNER_SYSTEM_PROMPT,
  buildPreparationPlannerUserPrompt,
} from '../../ai/prompts/preparationPlanner.prompt';
import { SkillsService } from '../skills/skills.service';
import { InterviewsService } from '../interviews/interviews.service';
import { EvaluatorService } from '../evaluations/evaluator.service';

export const inMemoryPlanStore = new Map<string, PreparationPlan>();

export class PreparationService {
  static async generatePlan(
    userId: string,
    targetRoleOverride?: string
  ): Promise<PreparationPlan> {
    const userSessions = await InterviewsService.getInterviewsByUser(userId);
    const targetRole =
      targetRoleOverride || userSessions[0]?.role || 'Senior Backend Engineer';

    const skillProfile = await SkillsService.getSkillProfile(userId);
    const weakCompetencies =
      skillProfile.topWeaknesses.length > 0
        ? skillProfile.topWeaknesses.map((s) => ({
            competency: s.skill,
            score: s.proficiencyScore,
          }))
        : [
            { competency: 'Distributed Systems & Caching', score: null },
            { competency: 'Database Concurrency & Locking', score: null },
          ];

    const missingConcepts: string[] = [];
    for (const session of userSessions) {
      const evals = await EvaluatorService.getEvaluationsByInterview(session.id);
      for (const ev of evals) {
        if (ev.missingConcepts) {
          missingConcepts.push(...ev.missingConcepts);
        }
      }
    }

    const completion = await AIOrchestrator.executeStructured(
      'PREPARATION_RECOMMENDER',
      PREPARATION_PLANNER_SYSTEM_PROMPT,
      buildPreparationPlannerUserPrompt({
        targetRole,
        weakCompetencies,
        missingConcepts: Array.from(new Set(missingConcepts)).slice(0, 8),
        assessedSkillsCount: skillProfile.assessedSkillsCount,
      }),
      PreparationPlanSchema,
      PREPARATION_PLANNER_PROMPT_VERSION,
      userId
    );

    const plan: PreparationPlan = {
      ...completion.data,
      userId,
      targetRole,
      recommendations: completion.data.recommendations.map((r) => ({
        ...r,
        completed: r.completed ?? false,
      })),
      generatedAt: new Date(),
    };

    inMemoryPlanStore.set(userId, plan);
    return plan;
  }

  static async getPlan(userId: string): Promise<PreparationPlan> {
    const cached = inMemoryPlanStore.get(userId);
    if (cached) return cached;
    return this.generatePlan(userId);
  }
}
