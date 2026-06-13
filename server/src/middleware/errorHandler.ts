import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/index.js';

/**
 * Centralized error handling middleware.
 * Catches all unhandled errors and returns consistent error responses.
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Multer file size error
  if ((err as any).name === 'MulterError') {
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File size too large. Maximum 5MB allowed.',
        code: 'UPLOAD_ERROR',
      });
      return;
    }
    if ((err as any).code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 images allowed.',
        code: 'UPLOAD_ERROR',
      });
      return;
    }
  }

  // Custom AppError
  if ((err as AppError).status) {
    res.status((err as AppError).status!).json({
      success: false,
      error: err.message,
      code: (err as AppError).code || 'ERROR',
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values((err as any).errors).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      error: messages.join(', '),
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(400).json({
      success: false,
      error: `Duplicate value for ${field}`,
      code: 'DUPLICATE',
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    code: 'DATABASE_ERROR',
  });
};

/**
 * 404 handler for undefined routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
};
