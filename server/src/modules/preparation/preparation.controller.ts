import { Request, Response, NextFunction } from 'express';
import { PreparationService } from './preparation.service';

export class PreparationController {
  static async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const plan = await PreparationService.getPlan(userId);
      res.status(200).json(plan);
    } catch (error) {
      next(error);
    }
  }

  static async generatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const targetRole = req.body.targetRole;
      const plan = await PreparationService.generatePlan(userId, targetRole);
      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }
}
