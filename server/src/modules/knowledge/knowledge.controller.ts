import { Request, Response } from 'express';
import { RetrievalEngine } from './retrieval.engine';

export class KnowledgeController {
  static search(req: Request, res: Response): void {
    const query = String(req.query.q || '');
    const category = req.query.category ? String(req.query.category) : undefined;

    const results = RetrievalEngine.search(query, category);
    res.status(200).json(results);
  }

  static getTopics(_req: Request, res: Response): void {
    const topics = RetrievalEngine.getTopics();
    res.status(200).json(topics);
  }
}
