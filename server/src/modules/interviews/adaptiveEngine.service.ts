import {
  AdaptiveDecision,
  DifficultyLevel,
  EvaluationScores,
  InterviewSession,
  Question,
  QuestionType,
} from '@interviewiq/shared';

export class AdaptiveEngineService {
  static computeAdaptation(
    session: InterviewSession,
    currentQuestion: Question,
    scores: EvaluationScores,
    missingConcepts: string[]
  ): AdaptiveDecision {
    const overall = scores.overallScore;
    const currentDiff = currentQuestion.difficulty;

    let nextDifficulty: DifficultyLevel = currentDiff;
    let nextSkill = currentQuestion.skill;
    let questionType: QuestionType = 'SCENARIO';
    let reason = '';
    let followUp = false;

    // Rule 1: High performance (overall >= 80) -> increase difficulty or advance topic
    if (overall >= 80) {
      if (currentDiff === 'EASY') nextDifficulty = 'MEDIUM';
      else if (currentDiff === 'MEDIUM') nextDifficulty = 'HARD';
      else if (currentDiff === 'HARD') nextDifficulty = 'EXPERT';
      else nextDifficulty = 'EXPERT';

      // Pick next unaddressed skill from plan
      const nextSkillCandidate = session.plan.targetSkills.find(
        (s) => !session.questions.some((q) => q.skill.toLowerCase() === s.toLowerCase())
      );
      if (nextSkillCandidate) {
        nextSkill = nextSkillCandidate;
        questionType = 'TRADEOFF';
        reason = `Demonstrated high competency in ${currentQuestion.skill} (${overall}%). Advancing difficulty to ${nextDifficulty} on ${nextSkill}.`;
      } else {
        questionType = 'SYSTEM_DESIGN';
        reason = `Consistent mastery demonstrated (${overall}%). Elevating to architectural edge-case challenge.`;
      }
    }
    // Rule 2: Incomplete answer (50 <= overall < 80) with missing concepts -> probe follow-up
    else if (overall >= 50 && missingConcepts.length > 0) {
      nextDifficulty = currentDiff;
      questionType = 'FOLLOW_UP';
      followUp = true;
      const targetMissing = missingConcepts[0];
      reason = `Satisfactory answer (${overall}%), but omitted ${targetMissing}. Probing targeted follow-up.`;
    }
    // Rule 3: Low performance (overall < 50) -> diagnostic reduction or foundational clarification
    else {
      if (currentDiff === 'EXPERT') nextDifficulty = 'HARD';
      else if (currentDiff === 'HARD') nextDifficulty = 'MEDIUM';
      else nextDifficulty = 'EASY';

      questionType = 'CONCEPTUAL';
      followUp = true;
      reason = `Struggled with ${currentQuestion.skill} (${overall}%). Calibrating difficulty down to ${nextDifficulty} for diagnostic foundation.`;
    }

    return {
      nextDifficulty,
      nextSkill,
      questionType,
      reason,
      followUp,
    };
  }
}
