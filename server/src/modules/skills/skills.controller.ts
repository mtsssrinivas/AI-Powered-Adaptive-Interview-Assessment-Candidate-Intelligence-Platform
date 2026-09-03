import { Request, Response, NextFunction } from 'express';
import { SkillsService } from './skills.service';

export class SkillsController {
  static async getSkills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const skills = await SkillsService.getSkills(userId);
      res.status(200).json(skills);
    } catch (error) {
      next(error);
    }
  }

  static async getSkillProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await SkillsService.getSkillProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  static async getSkillByName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const skillName = req.params.skill;
      const skill = await SkillsService.getSkillByName(userId, skillName);
      res.status(200).json(skill);
    } catch (error) {
      next(error);
    }
  }
}
