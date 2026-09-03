import { Request, Response, NextFunction } from 'express';
import { SubmitAnswerInputSchema } from '@interviewiq/shared';
import { InterviewsService } from '../interviews/interviews.service';
import { EvaluatorService } from './evaluator.service';

export class EvaluationsController {
  static async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviewId = req.params.id;
      const validated = SubmitAnswerInputSchema.parse(req.body);
      const result = await InterviewsService.submitAnswer(interviewId, validated);

      res.status(200).json({
        success: true,
        evaluation: result.evaluation,
        session: result.session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEvaluations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviewId = req.params.id;
      const evaluations = await EvaluatorService.getEvaluationsByInterview(interviewId);
      res.status(200).json(evaluations);
    } catch (error) {
      next(error);
    }
  }
}
