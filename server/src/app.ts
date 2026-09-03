import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { createV1Router } from './routes';

export const createApp = (): Express => {
  const app = express();

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS
  app.use(cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Idempotency-Key'],
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });
  app.use('/api/', limiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging & Correlation ID
  app.use(requestLogger);
  app.use(metricsMiddleware);

  // Mount API v1
  app.use('/api/v1', createV1Router());

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist on InterviewIQ API`,
      requestId: req.requestId,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
