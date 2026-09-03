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

export interface AIModelMetadata {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  description: string;
  recommendedFor: string[];
}

export const SUPPORTED_AI_MODELS: AIModelMetadata[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic / OpenRouter',
    contextWindow: 200000,
    description: 'Premier model for complex multi-dimensional architectural reasoning and code evaluation.',
    recommendedFor: ['ANSWER_EVALUATOR', 'PROJECT_DEFENSE', 'REPORT_GENERATOR'],
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI / OpenRouter',
    contextWindow: 128000,
    description: 'High-speed reasoning engine with structured outputs and fast JSON schema compliance.',
    recommendedFor: ['QUESTION_GENERATOR', 'RESUME_PARSER', 'INTERVIEW_PLANNER'],
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google / OpenRouter',
    contextWindow: 1000000,
    description: 'Massive context window ideal for comprehensive resume corpus ingestion and deep project defense.',
    recommendedFor: ['RESUME_PARSER', 'PROJECT_DEFENSE'],
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B Instruct',
    provider: 'Meta / OpenRouter',
    contextWindow: 8192,
    description: 'Open-weights foundation model offering high privacy and local deployment options.',
    recommendedFor: ['ADAPTIVE_DECISION', 'QUESTION_GENERATOR'],
  },
  {
    id: 'mock-deterministic',
    name: 'InterviewIQ Mock Provider',
    provider: 'Local / Offline',
    contextWindow: 32000,
    description: 'Deterministic zero-latency fallback engine guaranteeing 100% schema compliance in test and offline modes.',
    recommendedFor: ['TEST_SUITES', 'OFFLINE_DEVELOPMENT'],
  },
];

export class AIOrchestrator {
  private static primaryProvider: IAIProvider = new OpenRouterProvider();
  private static fallbackProvider: IAIProvider = new MockAIProvider();

  static async executeStructured<T>(
    capability: AICapability,
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodType<T>,
    promptVersion = 'v1.0.0',
    userId?: string,
    maxRetries = 3
  ): Promise<StructuredCompletionResult<T>> {
    const requestId = uuidv4();
    const useRealProvider = Boolean(
      env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0
    );

    const provider = useRealProvider ? this.primaryProvider : this.fallbackProvider;

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await provider.completeStructured<T>(
          systemPrompt,
          userPrompt,
          schema,
          { promptVersion }
        );

        // Record telemetry
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
        const isLastAttempt = attempt === maxRetries;
        logger.warn(
          `AI completion attempt ${attempt}/${maxRetries} failed for ${capability}: ${err.message}`
        );

        if (!isLastAttempt && err.status === 429) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 250));
          continue;
        }

        // Secondary fallback provider
        if (provider.name !== 'mock') {
          logger.info(`Switching to fallback provider for ${capability}`);
          try {
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
          } catch (fbErr: any) {
            logger.error(`Fallback provider also failed for ${capability}:`, {
              error: fbErr.message,
            });
          }
        }

        if (isLastAttempt) {
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
    }

    throw new Error(`Exceeded maximum retries for AI capability ${capability}`);
  }

  static getSupportedModels(): AIModelMetadata[] {
    return SUPPORTED_AI_MODELS;
  }

  static async getAIStatus(): Promise<{
    activeProvider: string;
    fallbackProvider: string;
    defaultModel: string;
    totalRequestsCount: number;
    successRate: number;
    averageLatencyMs: number;
    promptVersions: Record<string, string>;
  }> {
    const useRealProvider = Boolean(
      env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 0
    );

    let total = 0;
    let successful = 0;
    let totalLatency = 0;

    // Check Postgres
    try {
      const res = await queryPostgres(
        `SELECT COUNT(*) as total, 
                COUNT(CASE WHEN success = true THEN 1 END) as successful,
                COALESCE(AVG(latency_ms), 0) as avg_latency
         FROM ai_requests`
      );
      if (res.rows.length > 0) {
        total = parseInt(res.rows[0].total, 10) || 0;
        successful = parseInt(res.rows[0].successful, 10) || 0;
        totalLatency = Math.round(parseFloat(res.rows[0].avg_latency) || 0);
      }
    } catch {
      // In-memory fallback
    }

    if (total === 0) {
      const table = inMemoryStore.getTable('ai_requests');
      const all = Array.from(table.values());
      total = all.length;
      successful = all.filter((r) => r.success).length;
      totalLatency =
        total > 0
          ? Math.round(all.reduce((s, r) => s + (r.latencyMs || 0), 0) / total)
          : 0;
    }

    const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

    return {
      activeProvider: useRealProvider ? 'openrouter' : 'mock-deterministic',
      fallbackProvider: 'mock-deterministic',
      defaultModel: env.OPENROUTER_MODEL,
      totalRequestsCount: total,
      successRate,
      averageLatencyMs: totalLatency,
      promptVersions: {
        RESUME_PARSER: 'v1.0.0',
        QUESTION_GENERATOR: 'v1.0.0',
        ANSWER_EVALUATOR: 'v1.0.0',
        PROJECT_DEFENSE: 'v1.0.0',
        PREPARATION_RECOMMENDER: 'v1.0.0',
      },
    };
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
    const table = inMemoryStore.getTable('ai_requests');
    table.set(entry.id, {
      ...entry,
      createdAt: new Date(),
    });

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
      // Postgres handled in inMemoryStore fallback
    }
  }
}
