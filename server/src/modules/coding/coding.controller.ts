import { Request, Response, NextFunction } from 'express';
import {
  RunCodeInputSchema,
  SubmitCodeInputSchema,
} from '@interviewiq/shared';
import { CodingService } from './coding.service';

export class CodingController {
  static async getProblems(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = CodingService.getProblems();
      res.status(200).json(problems);
    } catch (error) {
      next(error);
    }
  }

  static async getProblemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const problem = CodingService.getProblemById(id);
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  }

  static async runSampleCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RunCodeInputSchema.parse(req.body);
      const result = await CodingService.runSampleCode(
        validated.problemId,
        validated.language,
        validated.code
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitSolution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = SubmitCodeInputSchema.parse(req.body);
      const result = await CodingService.submitSolution(
        userId,
        validated.interviewId,
        validated.problemId,
        validated.language,
        validated.code
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
