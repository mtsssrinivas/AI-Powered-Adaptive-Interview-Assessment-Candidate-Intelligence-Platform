import { Request, Response } from 'express';
import { MetricsCollector } from './metrics';

export class MetricsController {
  static getMetrics(req: Request, res: Response): void {
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('text/plain') || req.query.format === 'prometheus') {
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.status(200).send(MetricsCollector.getPrometheusMetrics());
      return;
    }

    res.status(200).json(MetricsCollector.getMetricsJSON());
  }
}
