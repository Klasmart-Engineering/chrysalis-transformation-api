import { NextFunction, Request, Response } from 'express';
import { log } from '../utils/logging';

export const checkAPIToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiSecret = req.get('X_API_SECRET');

  if (apiSecret !== process.env.API_SECRET) {
    log.error('Unauthorized');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};
