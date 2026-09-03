import { logger } from './config/logger';
import { connectMongo } from './config/mongo';
import { initPostgres } from './config/postgres';
import { initRedis } from './config/redis';

const startWorker = async () => {
  logger.info('Starting InterviewIQ 2.0 Background Worker Daemon...');

  await connectMongo();
  await initPostgres();
  initRedis();

  logger.info('InterviewIQ Worker listening for background jobs (Resume, AI, Evaluation, DSA, Reports)');

  process.on('SIGTERM', () => {
    logger.info('Worker shutting down...');
    process.exit(0);
  });
};

startWorker().catch((err) => {
  logger.error('Worker failed to start', { error: err });
  process.exit(1);
});
