import { Request, Response, NextFunction } from 'express';
import { ResumesService } from './resumes.service';
import { ValidationError } from '../../utils/errors';

export class ResumesController {
  static async uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user!.id;

      if (!file) {
        throw new ValidationError('A PDF resume file is required');
      }

      const result = await ResumesService.processResumeBuffer(
        userId,
        file.buffer,
        file.originalname
      );

      res.status(201).json({
        success: true,
        message: 'Resume parsed and intelligence extracted successfully',
        resume: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const resumes = await ResumesService.getResumesByUser(userId);
      res.status(200).json(resumes);
    } catch (error) {
      next(error);
    }
  }

  static async getResumeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resumeId = req.params.id;
      const resume = await ResumesService.getResumeById(resumeId);
      res.status(200).json(resume);
    } catch (error) {
      next(error);
    }
  }

  static async getExtractedProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projects = await ResumesService.getExtractedProjectsByUser(userId);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }
}
