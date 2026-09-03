import { Request, Response, NextFunction } from 'express';
import { CreateInterviewInputSchema } from '@interviewiq/shared';
import { InterviewsService } from './interviews.service';

export class InterviewsController {
  static async createInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = CreateInterviewInputSchema.parse(req.body);
      const session = await InterviewsService.createInterview(userId, validated);

      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }

  static async getInterviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviewId = req.params.id;
      const session = await InterviewsService.getInterviewById(interviewId);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  }

  static async getInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const sessions = await InterviewsService.getInterviewsByUser(userId);
      res.status(200).json(sessions);
    } catch (error) {
      next(error);
    }
  }
}
