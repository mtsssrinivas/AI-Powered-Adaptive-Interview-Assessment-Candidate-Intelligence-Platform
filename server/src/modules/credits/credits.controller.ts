import { Request, Response, NextFunction } from 'express';
import { CreditsService } from './credits.service';
import { ValidationError } from '../../utils/errors';

export class CreditsController {
  static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const balance = await CreditsService.getBalance(userId);
      res.status(200).json(balance);
    } catch (error) {
      next(error);
    }
  }

  static async deduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, reason, referenceId } = req.body;
      if (!amount || amount <= 0) {
        throw new ValidationError('A positive credit amount is required');
      }

      const balance = await CreditsService.deductCredits(
        userId,
        amount,
        reason || 'Interview session start',
        referenceId
      );
      res.status(200).json(balance);
    } catch (error) {
      next(error);
    }
  }
}
