import { SkillsService } from '../skills/skills.service';
import { InterviewsService } from '../interviews/interviews.service';
import { EvaluatorService } from '../evaluations/evaluator.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { inMemoryDefenseStore } from '../interviews/projectDefense.service';

export type HiringRecommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'LEAN_HIRE'
  | 'LEAN_NO_HIRE'
  | 'NO_HIRE'
  | 'NOT_ENOUGH_DATA';

export interface CandidateIntelligenceProfile {
  userId: string;
  readinessRating: number;
  hiringRecommendation: HiringRecommendation;
  executiveSummary: string;
  verifiedSkills: { skill: string; score: number; evidenceCount: number }[];
  claimedSkills: { skill: string; category: string }[];
  recurringWeaknesses: string[];
  competencyRadar: { category: string; score: number }[];
  projectAuthenticityIndex: number;
  totalInterviewsAssessed: number;
  lastAssessedAt: Date | null;
}

export class IntelligenceService {
  static async getIntelligenceProfile(userId: string): Promise<CandidateIntelligenceProfile> {
    const allSkills = await SkillsService.getSkills(userId);
    const userSessions = await InterviewsService.getInterviewsByUser(userId);
    const analytics = await AnalyticsService.getOverview(userId);

    const verifiedSkills = allSkills
      .filter((s) => s.proficiencyScore !== null && s.proficiencyScore >= 70)
      .map((s) => ({
        skill: s.skill,
        score: s.proficiencyScore!,
        evidenceCount: s.assessmentEvidence.length,
      }));

    const claimedSkills = allSkills
      .filter((s) => s.proficiencyLevel === 'EXPOSURE_ONLY')
      .map((s) => ({
        skill: s.skill,
        category: s.category,
      }));

    // Recurring weaknesses from all evaluations
    const weaknessCounts = new Map<string, number>();
    for (const session of userSessions) {
      const evals = await EvaluatorService.getEvaluationsByInterview(session.id);
      for (const ev of evals) {
        for (const w of ev.weaknesses) {
          weaknessCounts.set(w, (weaknessCounts.get(w) || 0) + 1);
        }
        for (const m of ev.missingConcepts) {
          weaknessCounts.set(m, (weaknessCounts.get(m) || 0) + 1);
        }
      }
    }

    const recurringWeaknesses = Array.from(weaknessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    // Radar categories
    const categories = [
      'Backend',
      'Frontend',
      'Databases',
      'System Design',
      'CS Fundamentals',
      'DevOps',
      'AI/ML',
    ];

    const competencyRadar = categories.map((cat) => {
      const skillsInCat = allSkills.filter((s) => s.category === cat && s.proficiencyScore !== null);
      const score =
        skillsInCat.length > 0
          ? Math.round(
              skillsInCat.reduce((sum, s) => sum + (s.proficiencyScore || 0), 0) / skillsInCat.length
            )
          : 0;
      return { category: cat, score };
    });

    // Project Authenticity Index
    let projectAuthenticityIndex = 0;
    const defenseEvals = Array.from(inMemoryDefenseStore.values()).filter((d) =>
      userSessions.some((s) => s.id === d.interviewId)
    );
    if (defenseEvals.length > 0) {
      projectAuthenticityIndex = Math.round(
        defenseEvals.reduce((s, d) => s + d.scores.ownershipAuthenticity, 0) / defenseEvals.length
      );
    } else if (verifiedSkills.length > 0) {
      projectAuthenticityIndex = 75; // Default exposure verification
    }

    // Readiness rating & Hiring recommendation
    const readinessRating = analytics.averageScore || 0;
    let hiringRecommendation: HiringRecommendation = 'NOT_ENOUGH_DATA';

    if (analytics.questionsCompleted >= 3) {
      if (readinessRating >= 85) hiringRecommendation = 'STRONG_HIRE';
      else if (readinessRating >= 75) hiringRecommendation = 'HIRE';
      else if (readinessRating >= 65) hiringRecommendation = 'LEAN_HIRE';
      else if (readinessRating >= 50) hiringRecommendation = 'LEAN_NO_HIRE';
      else hiringRecommendation = 'NO_HIRE';
    }

    let executiveSummary = 'Candidate profile has been initialized with baseline claims.';
    if (analytics.dataAvailable) {
      executiveSummary = `Candidate demonstrated an overall interview readiness of ${readinessRating}% across ${analytics.questionsCompleted} questions. Verified competencies include ${
        verifiedSkills.map((s) => s.skill).slice(0, 3).join(', ') || 'foundation'
      }. Recommendation verdict: ${hiringRecommendation}.`;
    }

    return {
      userId,
      readinessRating,
      hiringRecommendation,
      executiveSummary,
      verifiedSkills,
      claimedSkills,
      recurringWeaknesses,
      competencyRadar,
      projectAuthenticityIndex,
      totalInterviewsAssessed: userSessions.length,
      lastAssessedAt: userSessions[0]?.updatedAt ? new Date(userSessions[0].updatedAt) : null,
    };
  }

  static async getReadiness(userId: string): Promise<{ readinessRating: number; hiringRecommendation: HiringRecommendation }> {
    const profile = await this.getIntelligenceProfile(userId);
    return {
      readinessRating: profile.readinessRating,
      hiringRecommendation: profile.hiringRecommendation,
    };
  }
}
