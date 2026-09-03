import { Request, Response, NextFunction } from 'express';
import { CreateProjectDefenseInputSchema } from '@interviewiq/shared';
import { ProjectDefenseService } from './projectDefense.service';

export class ProjectDefenseController {
  static async startProjectDefense(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = CreateProjectDefenseInputSchema.parse(req.body);
      const result = await ProjectDefenseService.startProjectDefense(userId, validated);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectDefense(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const interviewId = req.params.id;
      const result = await ProjectDefenseService.getProjectDefense(interviewId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
