import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const overview = await AnalyticsService.getOverview(userId);
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  }

  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const trends = await AnalyticsService.getTrends(userId);
      res.status(200).json(trends);
    } catch (error) {
      next(error);
    }
  }

  static async getCompetencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const competencies = await AnalyticsService.getCompetencies(userId);
      res.status(200).json(competencies);
    } catch (error) {
      next(error);
    }
  }
}
