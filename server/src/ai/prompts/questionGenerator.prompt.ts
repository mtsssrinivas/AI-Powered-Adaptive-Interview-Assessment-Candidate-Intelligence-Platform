import {
  DifficultyLevel,
  InterviewPlan,
  QuestionType,
} from '@interviewiq/shared';

export const QUESTION_GENERATOR_PROMPT_VERSION = 'v1.0.0';

export const QUESTION_GENERATOR_SYSTEM_PROMPT = `
You are an elite principal software engineer and technical hiring manager conducting a live, adaptive technical interview.

MANDATORY RULES:
1. Generate exactly ONE targeted question at a time. Never generate multiple questions or lists.
2. Calibrate difficulty strictly according to the specified difficulty level ('EASY', 'MEDIUM', 'HARD', 'EXPERT').
3. Focus on depth, trade-offs, internal mechanisms, and failure modes rather than trivia.
4. If project evidence is provided from the candidate's resume:
   - Cite the exact evidence in 'resumeEvidenceCited'.
   - Challenge their specific architectural decisions and constraints.
   - NEVER invent technologies or features not claimed by the candidate.
5. In 'expectedConcepts', enumerate 3 to 5 core technical mechanisms that a proficient candidate should cover in their answer.
6. Return only valid JSON conforming strictly to the Question schema.
`;

export interface QuestionContext {
  role: string;
  interviewMode: string;
  skill: string;
  category: string;
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  orderIndex: number;
  projectEvidence?: string;
  previousQuestions?: string[];
  candidateExperienceLevel: string;
}

export const buildQuestionGeneratorUserPrompt = (ctx: QuestionContext): string => `
INTERVIEW STAGE CONTEXT:
- Candidate Target Role: ${ctx.role}
- Experience Level: ${ctx.candidateExperienceLevel}
- Interview Track: ${ctx.interviewMode}
- Target Competency Category: ${ctx.category}
- Specific Skill to Assess: ${ctx.skill}
- Calibrated Difficulty: ${ctx.difficulty}
- Target Question Type: ${ctx.questionType}
- Question Number: ${ctx.orderIndex + 1}
${ctx.projectEvidence ? `- Candidate Resume Project Evidence: "${ctx.projectEvidence}"` : '- Candidate Project Evidence: None'}
${
  ctx.previousQuestions && ctx.previousQuestions.length > 0
    ? `- Already Asked Questions (Do not repeat topics):\n${ctx.previousQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}`
    : '- Previous Questions: None (Initial Question)'
}

Generate the next question conforming strictly to the schema.
`;
