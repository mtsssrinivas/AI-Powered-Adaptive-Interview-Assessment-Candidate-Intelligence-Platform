import Redis from 'ioredis';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { env } from './env';
import { logger } from './logger';

export type RedisStatus = 'connected' | 'disconnected' | 'in_memory_fallback';

let redisClient: Redis | null = null;
let redisStatus: RedisStatus = 'disconnected';
let lastRedisError: string | null = null;

export const initRedis = (): Redis | null => {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          redisStatus = 'in_memory_fallback';
          return null; // stop retrying
        }
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      redisStatus = 'connected';
      lastRedisError = null;
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      redisStatus = 'in_memory_fallback';
      lastRedisError = err?.message || 'Redis unreachable';
      logger.warn('Redis unavailable. BullMQ will fallback to direct async worker execution.', {
        error: lastRedisError,
      });
    });

    return redisClient;
  } catch (error: any) {
    redisStatus = 'in_memory_fallback';
    lastRedisError = error?.message;
    logger.warn('Failed to initialize Redis client. Using fallback queue mode.');
    return null;
  }
};

export const getRedisStatus = (): { status: RedisStatus; error: string | null } => {
  return { status: redisStatus, error: lastRedisError };
};

export const getRedisClient = (): Redis | null => redisClient;

// BullMQ Queue Factory
export const createQueue = (queueName: string) => {
  if (redisStatus === 'connected' && redisClient) {
    return new Queue(queueName, { connection: redisClient });
  }
  return null;
};
