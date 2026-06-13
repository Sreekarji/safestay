import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

export const ownerMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Not authenticated.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied. Owner privileges required.',
      code: 'FORBIDDEN',
    });
    return;
  }

  // For owners, check verification status (admins bypass this)
  if (req.user.role === 'owner' && req.user.ownerVerification.status !== 'verified') {
    res.status(403).json({
      success: false,
      error: 'Access denied. Owner verification required.',
      code: 'FORBIDDEN',
    });
    return;
  }

  next();
};
