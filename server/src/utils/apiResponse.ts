import { Response } from 'express';

/**
 * Standardized API response helpers.
 * Use these instead of manually constructing response objects.
 */

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  code?: string
): void => {
  res.status(statusCode).json({
    success: false,
    error,
    ...(code && { code }),
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  },
  message?: string
): void => {
  res.json({
    success: true,
    data,
    pagination,
    ...(message && { message }),
  });
};

/**
 * Handle common error patterns in route handlers.
 * Returns true if the error was handled (response already sent).
 */
export const handleNotFound = (res: Response, entity: string): boolean => {
  sendError(res, `${entity} not found`, 404, 'NOT_FOUND');
  return true;
};

export const handleValidationError = (res: Response, message: string): boolean => {
  sendError(res, message, 400, 'VALIDATION_ERROR');
  return true;
};

export const handleUnauthorized = (res: Response, message: string = 'Access denied'): boolean => {
  sendError(res, message, 401, 'UNAUTHORIZED');
  return true;
};

export const handleForbidden = (res: Response, message: string = 'Access denied'): boolean => {
  sendError(res, message, 403, 'FORBIDDEN');
  return true;
};
