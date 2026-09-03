import { Request, Response, NextFunction } from 'express';
import { IntelligenceService } from './intelligence.service';

export class UsersController {
  static async getIntelligenceProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await IntelligenceService.getIntelligenceProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  static async getReadiness(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const readiness = await IntelligenceService.getReadiness(userId);
      res.status(200).json(readiness);
    } catch (error) {
      next(error);
    }
  }
}
