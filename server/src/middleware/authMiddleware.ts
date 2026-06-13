import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: 'Account has been banned.',
        code: 'FORBIDDEN',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Server error during authentication.',
      code: 'DATABASE_ERROR',
    });
  }
};
