import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Not authenticated.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
      code: 'FORBIDDEN',
    });
    return;
  }

  next();
};
