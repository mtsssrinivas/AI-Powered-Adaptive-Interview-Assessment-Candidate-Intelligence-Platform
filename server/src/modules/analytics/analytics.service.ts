import {
  AnalyticsOverview,
  HistoricalTrendPoint,
  CompetencySummary,
} from '@interviewiq/shared';
import { queryPostgres, inMemoryStore } from '../../config/postgres';
import { InterviewsService } from '../interviews/interviews.service';
import { EvaluatorService } from '../evaluations/evaluator.service';
import { SkillsService } from '../skills/skills.service';

export class AnalyticsService {
  static async getOverview(userId: string): Promise<AnalyticsOverview> {
    const userSessions = await InterviewsService.getInterviewsByUser(userId);
    const completedSessions = userSessions.filter(
      (s) => s.currentState === 'COMPLETED' || s.currentState === 'REPORT_GENERATED'
    );

    const allEvaluations: any[] = [];
    for (const session of userSessions) {
      const evals = await EvaluatorService.getEvaluationsByInterview(session.id);
      allEvaluations.push(...evals);
    }

    // Code execution telemetry
    let codeSubmissionsCount = 0;
    let acceptedCodeSubmissionsCount = 0;

    try {
      const execRes = await queryPostgres(
        `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted 
         FROM code_executions ce 
         JOIN interview_sessions ises ON ce.interview_id = ises.id 
         WHERE ises.user_id = $1`,
        [userId]
      );
      if (execRes.rows.length > 0 && parseInt(execRes.rows[0].total, 10) > 0) {
        codeSubmissionsCount = parseInt(execRes.rows[0].total, 10) || 0;
        acceptedCodeSubmissionsCount = parseInt(execRes.rows[0].accepted, 10) || 0;
      } else {
        const table = inMemoryStore.getTable('code_executions');
        for (const item of table.values()) {
          const matchingSession = userSessions.find((s) => s.id === item.interviewId);
          if (matchingSession) {
            codeSubmissionsCount++;
            if (item.status === 'ACCEPTED') acceptedCodeSubmissionsCount++;
          }
        }
      }
    } catch {
      const table = inMemoryStore.getTable('code_executions');
      for (const item of table.values()) {
        const matchingSession = userSessions.find((s) => s.id === item.interviewId);
        if (matchingSession) {
          codeSubmissionsCount++;
          if (item.status === 'ACCEPTED') acceptedCodeSubmissionsCount++;
        }
      }
    }

    const codingTestPassRate =
      codeSubmissionsCount > 0
        ? Math.round((acceptedCodeSubmissionsCount / codeSubmissionsCount) * 100)
        : null;

    const competencyBreakdown = await this.getCompetencies(userId);
    const recentTrends = await this.getTrends(userId);

    // Empty state when no evaluations exist
    if (allEvaluations.length === 0) {
      return {
        overallReadiness: null,
        technicalCorrectness: null,
        communication: null,
        problemSolving: null,
        systemDesign: null,
        dsa: null,
        interviewsCompleted: completedSessions.length,
        questionsCompleted: 0,
        averageScore: null,
        codingTestPassRate,
        totalPracticeTimeMinutes: userSessions.length * 15,
        competencyBreakdown,
        recentTrends,
        strongestCompetency: null,
        weakestCompetency: null,
        dataAvailable: false,
      };
    }

    const avg = (fn: (e: any) => number) =>
      Math.round((allEvaluations.reduce((acc, curr) => acc + fn(curr), 0) / allEvaluations.length) * 10) / 10;

    const technicalCorrectness = avg((e) => e.scores.technicalCorrectness);
    const communication = avg((e) => e.scores.communication);
    const problemSolving = avg((e) => e.scores.problemSolving);
    const averageScore = avg((e) => e.scores.overallScore);

    // Filter category specific averages
    const sysDesignEvals = allEvaluations.filter(
      (e) => e.category === 'System Design' || e.skill === 'System Architecture'
    );
    const systemDesign =
      sysDesignEvals.length > 0
        ? Math.round(
            (sysDesignEvals.reduce((s, e) => s + e.scores.overallScore, 0) / sysDesignEvals.length) * 10
          ) / 10
        : null;

    const dsaEvals = allEvaluations.filter(
      (e) => e.category === 'CS Fundamentals' || (e.skill && typeof e.skill === 'string' && e.skill.includes('Algorithms'))
    );
    const dsa =
      dsaEvals.length > 0
        ? Math.round((dsaEvals.reduce((s, e) => s + e.scores.overallScore, 0) / dsaEvals.length) * 10) / 10
        : null;

    const strongestCompetency =
      competencyBreakdown.length > 0 ? competencyBreakdown[0].competency : null;
    const weakestCompetency =
      competencyBreakdown.length > 1 ? competencyBreakdown[competencyBreakdown.length - 1].competency : null;

    return {
      overallReadiness: averageScore,
      technicalCorrectness,
      communication,
      problemSolving,
      systemDesign,
      dsa,
      interviewsCompleted: completedSessions.length,
      questionsCompleted: allEvaluations.length,
      averageScore,
      codingTestPassRate,
      totalPracticeTimeMinutes: Math.max(15, allEvaluations.length * 10),
      competencyBreakdown,
      recentTrends,
      strongestCompetency,
      weakestCompetency,
      dataAvailable: true,
    };
  }

  static async getTrends(userId: string): Promise<HistoricalTrendPoint[]> {
    const userSessions = await InterviewsService.getInterviewsByUser(userId);
    const trends: HistoricalTrendPoint[] = [];

    const sorted = [...userSessions].reverse();

    for (const session of sorted) {
      const evals = await EvaluatorService.getEvaluationsByInterview(session.id);
      if (evals.length === 0) continue;

      const score = Math.round(
        evals.reduce((sum, e) => sum + e.scores.overallScore, 0) / evals.length
      );
      const technicalCorrectness = Math.round(
        evals.reduce((sum, e) => sum + e.scores.technicalCorrectness, 0) / evals.length
      );
      const communication = Math.round(
        evals.reduce((sum, e) => sum + e.scores.communication, 0) / evals.length
      );
      const problemSolving = Math.round(
        evals.reduce((sum, e) => sum + e.scores.problemSolving, 0) / evals.length
      );

      trends.push({
        interviewId: session.id,
        date: new Date(session.createdAt).toISOString().split('T')[0],
        role: session.role,
        mode: session.interviewMode,
        score,
        technicalCorrectness,
        communication,
        problemSolving,
      });
    }

    return trends;
  }

  static async getCompetencies(userId: string): Promise<CompetencySummary[]> {
    const allSkills = await SkillsService.getSkills(userId);

    const summaries: CompetencySummary[] = [];

    for (const skill of allSkills) {
      if (skill.assessmentCount > 0 && skill.proficiencyScore !== null) {
        summaries.push({
          competency: skill.skill,
          averageScore: skill.proficiencyScore,
          evaluationsCount: skill.assessmentCount,
          trend:
            skill.strengthTrend === 'UNASSESSED'
              ? 'NOT_EVALUATED'
              : (skill.strengthTrend as any),
        });
      }
    }

    // Sort descending by average score
    return summaries.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  }
}
