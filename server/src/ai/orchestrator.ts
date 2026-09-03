import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { queryPostgres, inMemoryStore } from '../config/postgres';
import {
  IAIProvider,
  OpenRouterProvider,
  MockAIProvider,
  StructuredCompletionResult,
} from './providers/ai.provider';

export type AICapability =
  | 'RESUME_PARSER'
  | 'INTERVIEW_PLANNER'
  | 'QUESTION_GENERATOR'
  | 'ANSWER_EVALUATOR'
  | 'ADAPTIVE_DECISION'
  | 'PROJECT_DEFENSE'
  | 'REPORT_GENERATOR'
  | 'PREPARATION_RECOMMENDER';

export class AIOrchestrator {
  private static primaryProvider: IAIProvider = new OpenRouterProvider();
  private static fallbackProvider: IAIProvider = new MockAIProvider();

  static async executeStructured<T>(
    capability: AICapability,
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    promptVersion = 'v1.0.0',
    userId?: string
  ): Promise<StructuredCompletionResult<T>> {
    const requestId = uuidv4();
    const useRealProvider = Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0);

    const provider = useRealProvider ? this.primaryProvider : this.fallbackProvider;

    try {
      const result = await provider.completeStructured<T>(
        systemPrompt,
        userPrompt,
        schema,
        { promptVersion }
      );

      // Record telemetry in Postgres / inMemoryStore
      await this.logAIMetrics({
        id: requestId,
        userId,
        capability,
        provider: result.provider,
        model: result.model,
        promptVersion,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        success: true,
      });

      return result;
    } catch (err: any) {
      logger.warn(`AI provider ${provider.name} failed for ${capability}, falling back if possible:`, {
        error: err.message,
      });

      // Fallback attempt
      if (provider.name !== 'mock') {
        const fallbackResult = await this.fallbackProvider.completeStructured<T>(
          systemPrompt,
          userPrompt,
          schema,
          { promptVersion }
        );

        await this.logAIMetrics({
          id: requestId,
          userId,
          capability,
          provider: 'mock',
          model: 'mock-fallback',
          promptVersion,
          tokensUsed: fallbackResult.tokensUsed,
          latencyMs: fallbackResult.latencyMs,
          success: true,
        });

        return fallbackResult;
      }

      await this.logAIMetrics({
        id: requestId,
        userId,
        capability,
        provider: provider.name,
        model: env.OPENROUTER_MODEL,
        promptVersion,
        tokensUsed: 0,
        latencyMs: 0,
        success: false,
        errorMessage: err.message,
      });

      throw err;
    }
  }

  private static async logAIMetrics(entry: {
    id: string;
    userId?: string;
    capability: string;
    provider: string;
    model: string;
    promptVersion: string;
    tokensUsed: number;
    latencyMs: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await queryPostgres(
        `INSERT INTO ai_requests (id, user_id, capability, provider, model, prompt_version, tokens_used, latency_ms, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entry.id,
          entry.userId || null,
          entry.capability,
          entry.provider,
          entry.model,
          entry.promptVersion,
          entry.tokensUsed,
          entry.latencyMs,
          entry.success,
          entry.errorMessage || null,
        ]
      );
    } catch {
      const table = inMemoryStore.getTable('ai_requests');
      table.set(entry.id, {
        ...entry,
        createdAt: new Date(),
      });
    }
  }
}
