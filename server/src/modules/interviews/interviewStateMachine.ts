import { InterviewState } from '@interviewiq/shared';
import { ValidationError } from '../../utils/errors';

export const ALLOWED_TRANSITIONS: Record<InterviewState, InterviewState[]> = {
  CREATED: ['RESUME_ANALYZED', 'PLANNED'],
  RESUME_ANALYZED: ['PLANNED'],
  PLANNED: ['QUESTION_ACTIVE'],
  QUESTION_ACTIVE: ['ANSWER_SUBMITTED', 'COMPLETED'],
  ANSWER_SUBMITTED: ['ANSWER_EVALUATED'],
  ANSWER_EVALUATED: ['FOLLOWUP_DECISION', 'NEXT_QUESTION', 'COMPLETED'],
  FOLLOWUP_DECISION: ['NEXT_QUESTION', 'QUESTION_ACTIVE', 'COMPLETED'],
  NEXT_QUESTION: ['QUESTION_ACTIVE', 'COMPLETED'],
  COMPLETED: ['REPORT_GENERATED'],
  REPORT_GENERATED: [],
};

export class InterviewStateMachine {
  static canTransition(current: InterviewState, next: InterviewState): boolean {
    const allowed = ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  static assertValidTransition(current: InterviewState, next: InterviewState): void {
    if (!this.canTransition(current, next)) {
      throw new ValidationError(
        `Invalid interview state transition from '${current}' to '${next}'. Allowed: [${(
          ALLOWED_TRANSITIONS[current] || []
        ).join(', ')}]`
      );
    }
  }
}
