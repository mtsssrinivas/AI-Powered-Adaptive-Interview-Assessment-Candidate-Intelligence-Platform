import {
  CreateInterviewInput,
  InterviewPlan,
  InterviewPlanCompetencyWeight,
  InterviewType,
} from '@interviewiq/shared';
import { SkillsService } from '../skills/skills.service';

export class InterviewPlannerService {
  private static defaultWeights: Record<InterviewType, InterviewPlanCompetencyWeight[]> = {
    TECHNICAL: [
      { category: 'CS Fundamentals', percentage: 30 },
      { category: 'Programming Languages', percentage: 30 },
      { category: 'Databases', percentage: 20 },
      { category: 'Behavioral', percentage: 20 },
    ],
    BACKEND: [
      { category: 'Backend', percentage: 35 },
      { category: 'System Design', percentage: 25 },
      { category: 'Databases', percentage: 20 },
      { category: 'CS Fundamentals', percentage: 10 },
      { category: 'Behavioral', percentage: 10 },
    ],
    FRONTEND: [
      { category: 'Frontend', percentage: 45 },
      { category: 'Programming Languages', percentage: 20 },
      { category: 'System Design', percentage: 15 },
      { category: 'CS Fundamentals', percentage: 10 },
      { category: 'Behavioral', percentage: 10 },
    ],
    AIML: [
      { category: 'AI/ML', percentage: 45 },
      { category: 'Programming Languages', percentage: 25 },
      { category: 'Databases', percentage: 15 },
      { category: 'Cloud', percentage: 15 },
    ],
    DSA: [
      { category: 'CS Fundamentals', percentage: 60 },
      { category: 'Programming Languages', percentage: 40 },
    ],
    SYSTEM_DESIGN: [
      { category: 'System Design', percentage: 60 },
      { category: 'Databases', percentage: 25 },
      { category: 'Cloud', percentage: 15 },
    ],
    BEHAVIORAL: [{ category: 'Behavioral', percentage: 100 }],
    PROJECT_DEFENSE: [
      { category: 'System Design', percentage: 50 },
      { category: 'Databases', percentage: 25 },
      { category: 'DevOps', percentage: 25 },
    ],
    FULL_INTERVIEW: [
      { category: 'Backend', percentage: 25 },
      { category: 'System Design', percentage: 25 },
      { category: 'CS Fundamentals', percentage: 25 },
      { category: 'Behavioral', percentage: 25 },
    ],
  };

  static async generatePlan(userId: string, input: CreateInterviewInput): Promise<InterviewPlan> {
    // 1. Determine competency weights
    const competencyWeights =
      input.customWeights && input.customWeights.length > 0
        ? input.customWeights
        : this.defaultWeights[input.interviewMode] || this.defaultWeights.TECHNICAL;

    // Normalize weights to sum to 100%
    const totalRaw = competencyWeights.reduce((sum, w) => sum + w.percentage, 0);
    const normalizedWeights = competencyWeights.map((w) => ({
      category: w.category,
      percentage: Math.round((w.percentage / (totalRaw || 1)) * 100),
    }));

    // 2. Determine target skills from candidate profile or defaults
    const candidateSkills = await SkillsService.getSkills(userId);
    let targetSkills = input.selectedSkills;

    if (!targetSkills || targetSkills.length === 0) {
      if (candidateSkills.length > 0) {
        // Target candidate's unassessed or lowest-scoring skills for adaptive diagnostic
        targetSkills = candidateSkills
          .sort((a, b) => (a.proficiencyScore ?? -1) - (b.proficiencyScore ?? -1))
          .slice(0, 6)
          .map((s) => s.skill);
      } else {
        targetSkills = ['Data Structures', 'REST APIs', 'SQL', 'Concurrency', 'System Architecture'];
      }
    }

    const codingEnabled =
      input.interviewMode === 'DSA' ||
      input.interviewMode === 'TECHNICAL' ||
      input.interviewMode === 'FULL_INTERVIEW';

    const projectDefenseEnabled =
      input.interviewMode === 'PROJECT_DEFENSE' ||
      input.interviewMode === 'BACKEND' ||
      input.interviewMode === 'FULL_INTERVIEW';

    return {
      targetRole: input.role,
      experienceLevel: input.experienceLevel,
      interviewMode: input.interviewMode,
      estimatedDurationMinutes: input.durationMinutes,
      totalQuestionTarget: input.questionCount,
      competencyWeights: normalizedWeights,
      targetSkills,
      codingEnabled,
      behavioralEnabled: input.interviewMode !== 'DSA',
      projectDefenseEnabled,
    };
  }
}
