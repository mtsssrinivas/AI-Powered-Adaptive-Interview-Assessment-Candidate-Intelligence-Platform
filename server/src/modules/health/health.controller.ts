import { Request, Response } from 'express';
import { getMongoStatus } from '../../config/mongo';
import { getPostgresStatus } from '../../config/postgres';
import { getRedisStatus } from '../../config/redis';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const mongo = getMongoStatus();
  const postgres = getPostgresStatus();
  const redis = getRedisStatus();

  const isHealthy = mongo.status === 'connected' || mongo.status === 'disconnected';

  const healthData = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'InterviewIQ API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: {
      rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
      heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
    infrastructure: {
      mongodb: {
        status: mongo.status,
        error: mongo.error,
      },
      postgresql: {
        status: postgres.status,
        error: postgres.error,
      },
      redis: {
        status: redis.status,
        error: redis.error,
      },
    },
  };

  res.status(200).json(healthData);
};

export const getReadiness = async (_req: Request, res: Response): Promise<void> => {
  const mongo = getMongoStatus();
  const isReady = true; // API is accepting traffic
  res.status(200).json({ ready: isReady, mongoStatus: mongo.status, timestamp: new Date().toISOString() });
};
