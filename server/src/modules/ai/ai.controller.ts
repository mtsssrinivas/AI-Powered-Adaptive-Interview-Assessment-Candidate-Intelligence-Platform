import { Request, Response, NextFunction } from 'express';
import { AIOrchestrator } from '../../ai/orchestrator';

export class AIController {
  static async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await AIOrchestrator.getAIStatus();
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  static getModels(_req: Request, res: Response): void {
    const models = AIOrchestrator.getSupportedModels();
    res.status(200).json(models);
  }
}
