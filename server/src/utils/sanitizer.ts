/**
 * Input sanitization utilities.
 * Prevents XSS and injection attacks in user input.
 */

/**
 * Strip HTML tags from a string.
 */
export const stripHtml = (input: string): string => {
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Sanitize a string for safe storage/display.
 * - Trims whitespace
 * - Strips HTML tags
 * - Collapses multiple spaces
 */
export const sanitizeString = (input: string): string => {
  return stripHtml(input).trim().replace(/\s+/g, ' ');
};

/**
 * Sanitize an object's string fields recursively.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const val = sanitized[key];
    if (typeof val === 'string') {
      (sanitized as any)[key] = sanitizeString(val);
    } else if (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val)
    ) {
      (sanitized as any)[key] = sanitizeObject(val);
    }
  }
  return sanitized;
};

/**
 * Validate email format.
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate phone number format (Indian numbers).
 */
export const isValidPhone = (phone: string): boolean => {
  return /^\+?[1-9]\d{9,14}$/.test(phone);
};

/**
 * Validate pincode (Indian 6-digit).
 */
export const isValidPincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};
