import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  if (!env.API_KEY || !apiKey || apiKey !== env.API_KEY) {
    return res.status(401).json({ error: 'API Key invalida o no proporcionada' });
  }
  next();
}
