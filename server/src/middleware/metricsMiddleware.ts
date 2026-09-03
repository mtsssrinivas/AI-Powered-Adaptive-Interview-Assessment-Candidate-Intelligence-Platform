import { Request, Response, NextFunction } from 'express';
import { MetricsCollector } from '../observability/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    MetricsCollector.recordRequest(req.method, route, res.statusCode, duration);
  });

  next();
};
