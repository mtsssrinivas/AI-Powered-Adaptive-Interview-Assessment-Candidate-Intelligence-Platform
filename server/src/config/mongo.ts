import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export type MongoStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

let mongoStatus: MongoStatus = 'disconnected';
let lastError: string | null = null;

export const connectMongo = async (): Promise<void> => {
  mongoStatus = 'connecting';
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    mongoStatus = 'connected';
    lastError = null;
    logger.info('MongoDB connected successfully', { uri: env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') });
  } catch (error: any) {
    mongoStatus = 'error';
    lastError = error?.message || 'Failed to connect to MongoDB';
    logger.warn('MongoDB connection failed. System will operate with fallback/pending store for offline development.', {
      error: lastError,
    });
  }

  mongoose.connection.on('disconnected', () => {
    mongoStatus = 'disconnected';
    logger.warn('MongoDB connection lost');
  });

  mongoose.connection.on('reconnected', () => {
    mongoStatus = 'connected';
    logger.info('MongoDB reconnected');
  });
};

export const getMongoStatus = (): { status: MongoStatus; error: string | null } => {
  return { status: mongoStatus, error: lastError };
};
