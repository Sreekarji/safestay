/**
 * Structured logging utility.
 * Provides consistent log formatting across the application.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatMessage = (level: LogLevel, message: string, meta?: Record<string, any>): string => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }

  return base;
};

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(formatMessage('info', message, meta));
  },

  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(formatMessage('warn', message, meta));
  },

  error: (message: string, meta?: Record<string, any>) => {
    console.error(formatMessage('error', message, meta));
  },

  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

export default logger;
