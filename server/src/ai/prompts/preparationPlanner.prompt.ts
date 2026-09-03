export const PREPARATION_PLANNER_PROMPT_VERSION = 'v1.0.0';

export const PREPARATION_PLANNER_SYSTEM_PROMPT = `
You are a senior engineering mentor and principal software architect creating a customized, high-impact technical interview preparation roadmap for a software engineer.

ROADMAP REQUIREMENTS:
1. Focus directly on the candidate's demonstrated skill weaknesses, missing architectural concepts, and lowest scoring competencies.
2. Every recommendation must provide concrete, actionable study advice (not generic 'study hard' statements).
3. Include specific coding drills or architecture exercises.
4. Estimate realistic study hours per recommendation.
5. Prioritize recommendations sequentially (Priority 1 = most urgent gap).
6. Return only valid JSON conforming strictly to the PreparationPlan schema.
`;

export interface PreparationPlanContext {
  targetRole: string;
  weakCompetencies: { competency: string; score: number | null }[];
  missingConcepts: string[];
  assessedSkillsCount: number;
}

export const buildPreparationPlannerUserPrompt = (ctx: PreparationPlanContext): string => `
CANDIDATE PROFILE GAPS:
- Target Role: ${ctx.targetRole}
- Assessed Competencies Count: ${ctx.assessedSkillsCount}
- Weakest Competencies:
${ctx.weakCompetencies.map((w) => `  - ${w.competency}: ${w.score !== null ? `${w.score}%` : 'Unassessed'}`).join('\n')}
- Recurring Missing Concepts / Knowledge Gaps from Recent Interviews:
${ctx.missingConcepts.length > 0 ? ctx.missingConcepts.map((m) => `  - ${m}`).join('\n') : '  - None recorded'}

Generate a prioritized, actionable technical interview preparation plan conforming strictly to the schema.
`;
