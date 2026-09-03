import pdfParse from 'pdf-parse';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ResumeModel } from '../../db/mongo/models/Resume.model';
import { AIOrchestrator } from '../../ai/orchestrator';
import {
  RESUME_PARSER_PROMPT_VERSION,
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserUserPrompt,
} from '../../ai/prompts/resumeParser.prompt';
import {
  ParsedCandidateProfileSchema,
  Resume,
  ExtractedProject,
  ParsedCandidateProfile,
} from '@interviewiq/shared';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../config/logger';

export const inMemoryResumeStore = new Map<string, Resume>();

export class ResumesService {
  static async processResumeBuffer(
    userId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<Resume> {
    const resumeId = uuidv4();
    const fileSize = fileBuffer.length;

    // 1. Text extraction from PDF
    let rawText = '';
    try {
      const pdfData = await pdfParse(fileBuffer);
      rawText = pdfData.text ? pdfData.text.trim() : '';
    } catch (err: any) {
      // Fallback stream text extraction if xref table is corrupted in mock/test buffers
      const asString = fileBuffer.toString('utf-8');
      const textMatches = asString.match(/\(([^)]+)\)\s*Tj/g);
      if (textMatches && textMatches.length > 0) {
        rawText = textMatches.map((m) => m.replace(/[()]/g, '').replace(/Tj/, '').trim()).join('\n');
      } else {
        logger.error('PDF extraction failed:', { error: err.message, fileName });
        throw new ValidationError('Could not parse PDF. The file may be corrupt or encrypted.');
      }
    }

    if (!rawText || rawText.length < 20) {
      throw new ValidationError('The uploaded PDF does not contain sufficient readable text.');
    }

    // 2. Structured LLM extraction via AI Orchestrator
    let parsedProfile: ParsedCandidateProfile;
    try {
      const completion = await AIOrchestrator.executeStructured(
        'RESUME_PARSER',
        RESUME_PARSER_SYSTEM_PROMPT,
        buildResumeParserUserPrompt(rawText),
        ParsedCandidateProfileSchema,
        RESUME_PARSER_PROMPT_VERSION,
        userId
      );
      parsedProfile = completion.data as ParsedCandidateProfile;
    } catch (err: any) {
      logger.error('AI Resume parsing failed:', { error: err.message });
      throw new ValidationError(`Resume intelligence extraction failed: ${err.message}`);
    }

    // 3. Assemble complete Resume entity
    const resumeEntity: Resume = {
      id: resumeId,
      userId,
      fileName,
      fileSize,
      rawText,
      parsedProfile: parsedProfile as any,
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Mongo if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = new ResumeModel({
          _id: resumeId,
          ...resumeEntity,
        });
        await doc.save();
      } catch (err: any) {
        logger.warn('Failed saving resume to MongoDB, stored in memory store:', { error: err.message });
      }
    }

    inMemoryResumeStore.set(resumeId, resumeEntity);

    return resumeEntity;
  }

  static async getResumesByUser(userId: string): Promise<Resume[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const docs = await ResumeModel.find({ userId }).sort({ createdAt: -1 });
        if (docs.length > 0) {
          return docs.map((d) => d.toJSON() as Resume);
        }
      } catch {
        // Mongo fallback
      }
    }

    return Array.from(inMemoryResumeStore.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getResumeById(resumeId: string): Promise<Resume> {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await ResumeModel.findById(resumeId);
        if (doc) return doc.toJSON() as Resume;
      } catch {
        // Mongo fallback
      }
    }

    const cached = inMemoryResumeStore.get(resumeId);
    if (!cached) {
      throw new NotFoundError('Resume record not found');
    }
    return cached;
  }

  static async getExtractedProjectsByUser(userId: string): Promise<ExtractedProject[]> {
    const resumes = await this.getResumesByUser(userId);
    const projects: ExtractedProject[] = [];

    for (const res of resumes) {
      if (res.parsedProfile?.projects) {
        projects.push(...res.parsedProfile.projects);
      }
    }

    return projects;
  }
}
