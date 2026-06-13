import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User.js';

// Extended Request with authenticated user
export interface AuthRequest extends Request {
  user?: IUser;
}

// Standard API response shape
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// AI verification verdict
export interface AIVerdict {
  verdict: 'accept' | 'reject' | 'uncertain';
  confidence: number;
  reasoning: string;
}

// AI verification result from all 3 models
export interface AIVerificationResult {
  mistral: AIVerdict | null;
  groq: AIVerdict | null;
  gemini: AIVerdict | null;
  consensus: 'accept' | 'reject' | 'pending';
  overallConfidence: number;
}

// SSI calculation result
export interface SSICalculationResult {
  ssi: number;
  penalties: Array<{
    reportId: string;
    category: string;
    penalty: number;
    severityWeight: number;
    categoryMultiplier: number;
    timeDecay: number;
    upvoteMultiplier: number;
    statusMultiplier: number;
  }>;
  categoryScores: Record<string, number>;
}

// Query parameters for list endpoints
export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

// Error with status code
export interface AppError extends Error {
  status?: number;
  code?: string;
}

// Multer file with Cloudinary result
export interface UploadedImage {
  url: string;
  publicId: string;
}
