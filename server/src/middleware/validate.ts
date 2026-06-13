import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

/**
 * Lightweight request validation middleware.
 * No external dependencies — uses simple validation functions.
 */

type ValidatorFn = (value: any) => string | null;

interface FieldRules {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: readonly (string | number)[];
    custom?: ValidatorFn;
  };
}

/**
 * Create a validation middleware from a rules object.
 *
 * Example:
 *   router.post('/', validate({
 *     email: { required: true, type: 'string' },
 *     password: { required: true, type: 'string', minLength: 8 },
 *     role: { required: false, type: 'string', enum: ['student', 'admin'] },
 *   }), handler);
 */
export const validate = (rules: FieldRules) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const body = req.body;

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip further checks if not required and not present
      if (value === undefined || value === null) continue;

      // Type check
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field} must be a string`);
              continue;
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${field} must be a number`);
              continue;
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field} must be a boolean`);
              continue;
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${field} must be an array`);
              continue;
            }
            break;
          case 'object':
            if (typeof value !== 'object' || Array.isArray(value)) {
              errors.push(`${field} must be an object`);
              continue;
            }
            break;
        }
      }

      // String validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be at most ${rule.maxLength} characters`);
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field} must be at most ${rule.max}`);
        }
      }

      // Enum check
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Custom validation
      if (rule.custom) {
        const error = rule.custom(value);
        if (error) errors.push(error);
      }
    }

    if (errors.length > 0) {
      sendError(res, errors.join('; '), 400, 'VALIDATION_ERROR');
      return;
    }

    next();
  };
};
