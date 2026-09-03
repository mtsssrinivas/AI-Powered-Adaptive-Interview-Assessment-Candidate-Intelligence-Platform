import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { SkillNodeModel } from '../../db/mongo/models/SkillNode.model';
import {
  CandidateSkillNode,
  CandidateSkillProfile,
  ExtractedSkill,
  SkillCategory,
  SkillProficiencyLevel,
  StrengthTrend,
} from '@interviewiq/shared';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../config/logger';

export const inMemorySkillStore = new Map<string, CandidateSkillNode>();

export class SkillsService {
  static async seedSkillsFromResume(
    userId: string,
    extractedSkills: ExtractedSkill[]
  ): Promise<void> {
    for (const item of extractedSkills) {
      const key = `${userId}:${item.skill.toLowerCase()}`;
      const existing = inMemorySkillStore.get(key);

      const resumeEvidence = existing
        ? Array.from(new Set([...existing.resumeEvidence, item.evidence]))
        : [item.evidence];

      const node: CandidateSkillNode = {
        id: existing?.id || uuidv4(),
        userId,
        skill: item.skill,
        category: item.category,
        resumeEvidence,
        assessmentEvidence: existing?.assessmentEvidence || [],
        proficiencyScore: existing?.proficiencyScore ?? null,
        proficiencyLevel: existing?.proficiencyLevel || 'EXPOSURE_ONLY',
        confidence: item.confidence ?? 0.8,
        assessmentCount: existing?.assessmentCount || 0,
        strengthTrend: existing?.strengthTrend || 'UNASSESSED',
        lastAssessedAt: existing?.lastAssessedAt || null,
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      inMemorySkillStore.set(key, node);

      if (mongoose.connection.readyState === 1) {
        try {
          await SkillNodeModel.findOneAndUpdate(
            { userId, skill: item.skill },
            {
              $setOnInsert: { _id: node.id, createdAt: new Date() },
              $set: {
                category: node.category,
                proficiencyScore: node.proficiencyScore,
                proficiencyLevel: node.proficiencyLevel,
                confidence: node.confidence,
                assessmentCount: node.assessmentCount,
                strengthTrend: node.strengthTrend,
                updatedAt: new Date(),
              },
              $addToSet: { resumeEvidence: item.evidence },
            },
            { upsert: true, new: true }
          );
        } catch (err: any) {
          logger.warn('Failed saving skill node to Mongo:', { error: err.message });
        }
      }
    }
  }

  static async recordAssessmentResult(
    userId: string,
    skillName: string,
    score: number,
    feedbackEvidence: string
  ): Promise<CandidateSkillNode> {
    const key = `${userId}:${skillName.toLowerCase()}`;
    const existing = inMemorySkillStore.get(key);

    const prevScore = existing?.proficiencyScore;
    const prevCount = existing?.assessmentCount || 0;
    const newCount = prevCount + 1;

    // Moving average score computation
    const newScore = prevScore !== null && prevScore !== undefined
      ? (prevScore * prevCount + score) / newCount
      : score;

    // Calculate trend
    let trend: StrengthTrend = 'STABLE';
    if (prevScore !== null && prevScore !== undefined) {
      if (score > prevScore + 3) trend = 'IMPROVING';
      else if (score < prevScore - 3) trend = 'DECLINING';
    } else {
      trend = 'STABLE';
    }

    // Determine demonstrated proficiency level
    let proficiencyLevel: SkillProficiencyLevel = 'NOVICE';
    if (newScore >= 85) proficiencyLevel = 'EXPERT';
    else if (newScore >= 70) proficiencyLevel = 'PROFICIENT';
    else if (newScore >= 50) proficiencyLevel = 'INTERMEDIATE';

    const updatedNode: CandidateSkillNode = {
      id: existing?.id || uuidv4(),
      userId,
      skill: existing?.skill || skillName,
      category: existing?.category || 'Backend',
      resumeEvidence: existing?.resumeEvidence || [],
      assessmentEvidence: [...(existing?.assessmentEvidence || []), feedbackEvidence],
      proficiencyScore: Math.round(newScore * 10) / 10,
      proficiencyLevel,
      confidence: Math.min(1, (existing?.confidence || 0.5) + 0.1),
      assessmentCount: newCount,
      strengthTrend: trend,
      lastAssessedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    inMemorySkillStore.set(key, updatedNode);

    if (mongoose.connection.readyState === 1) {
      try {
        await SkillNodeModel.findOneAndUpdate(
          { userId, skill: updatedNode.skill },
          {
            $set: {
              proficiencyScore: updatedNode.proficiencyScore,
              proficiencyLevel: updatedNode.proficiencyLevel,
              confidence: updatedNode.confidence,
              assessmentCount: updatedNode.assessmentCount,
              strengthTrend: updatedNode.strengthTrend,
              lastAssessedAt: updatedNode.lastAssessedAt,
              updatedAt: new Date(),
            },
            $push: { assessmentEvidence: feedbackEvidence },
          },
          { upsert: true, new: true }
        );
      } catch (err: any) {
        logger.warn('Failed updating skill assessment to Mongo:', { error: err.message });
      }
    }

    return updatedNode;
  }

  static async getSkills(userId: string): Promise<CandidateSkillNode[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await SkillNodeModel.find({ userId }).sort({ category: 1, skill: 1 });
        if (docs.length > 0) {
          return docs.map((d) => d.toJSON() as CandidateSkillNode);
        }
      } catch {
        // Mongo fallback
      }
    }

    return Array.from(inMemorySkillStore.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => a.category.localeCompare(b.category) || a.skill.localeCompare(b.skill));
  }

  static async getSkillByName(userId: string, skillName: string): Promise<CandidateSkillNode> {
    const key = `${userId}:${skillName.toLowerCase()}`;
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await SkillNodeModel.findOne({
          userId,
          skill: { $regex: new RegExp(`^${skillName}$`, 'i') },
        });
        if (doc) return doc.toJSON() as CandidateSkillNode;
      } catch {
        // Mongo fallback
      }
    }

    const cached = inMemorySkillStore.get(key);
    if (!cached) {
      throw new NotFoundError(`Candidate skill '${skillName}' not found`);
    }
    return cached;
  }

  static async getSkillProfile(userId: string): Promise<CandidateSkillProfile> {
    const allSkills = await this.getSkills(userId);

    const assessed = allSkills.filter((s) => s.proficiencyScore !== null);
    const unassessed = allSkills.filter((s) => s.proficiencyScore === null);

    // Top strengths (highest demonstrated scores)
    const topStrengths = [...assessed]
      .sort((a, b) => (b.proficiencyScore || 0) - (a.proficiencyScore || 0))
      .slice(0, 5);

    // Top weaknesses (lowest demonstrated scores among assessed)
    const topWeaknesses = [...assessed]
      .sort((a, b) => (a.proficiencyScore || 0) - (b.proficiencyScore || 0))
      .slice(0, 5);

    const categories: SkillCategory[] = [
      'Programming Languages',
      'Frontend',
      'Backend',
      'Databases',
      'Cloud',
      'AI/ML',
      'DevOps',
      'CS Fundamentals',
      'Tools',
    ];

    const categoryBreakdown: any = {};

    for (const cat of categories) {
      const skillsInCat = allSkills.filter((s) => s.category === cat);
      const assessedInCat = skillsInCat.filter((s) => s.proficiencyScore !== null);

      const avgScore =
        assessedInCat.length > 0
          ? Math.round(
              (assessedInCat.reduce((acc, curr) => acc + (curr.proficiencyScore || 0), 0) /
                assessedInCat.length) *
                10
            ) / 10
          : null;

      categoryBreakdown[cat] = {
        total: skillsInCat.length,
        assessed: assessedInCat.length,
        averageScore: avgScore,
        skills: skillsInCat,
      };
    }

    return {
      userId,
      totalSkillsTracked: allSkills.length,
      assessedSkillsCount: assessed.length,
      unassessedSkillsCount: unassessed.length,
      topStrengths,
      topWeaknesses,
      categoryBreakdown,
    };
  }
}
