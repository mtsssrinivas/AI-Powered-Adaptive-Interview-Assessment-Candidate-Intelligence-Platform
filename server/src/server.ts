import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo } from './config/mongo';
import { initPostgres } from './config/postgres';
import { initRedis } from './config/redis';

const startServer = async () => {
  logger.info('Starting InterviewIQ 2.0 Backend Service...', {
    env: env.NODE_ENV,
    port: env.PORT,
  });

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`InterviewIQ Server running at http://localhost:${env.PORT}`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });

  // Connect to persistent data stores in background so server starts instantly
  connectMongo().catch((err) => logger.warn('MongoDB initial connection attempt:', { err: err?.message }));
  initPostgres().catch((err) => logger.warn('PostgreSQL initial connection attempt:', { err: err?.message }));
  initRedis();

  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  logger.error('Fatal error during startup:', { error });
  process.exit(1);
});
