import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof ZodError || err?.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: (err.issues || []).map((issue: any) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
      requestId,
    });
    return;
  }

  // Unhandled / Internal Server Error
  logger.error('Unhandled Exception Caught:', {
    message: err?.message,
    stack: err?.stack,
    requestId,
    url: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err?.message,
    requestId,
  });
};
