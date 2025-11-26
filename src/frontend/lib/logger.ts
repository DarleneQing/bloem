// Production-safe logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger class that only logs debug/info messages in development
 * and always logs warnings/errors
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Internal log method
   */
  private log(level: LogLevel, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.log(prefix, ...args);
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(prefix, ...args);
        }
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        // In production, you could add error reporting here (e.g., Sentry)
        break;
    }
  }

  /**
   * Debug level - only logs in development
   * Use for detailed debugging information
   */
  debug(...args: unknown[]) {
    this.log('debug', ...args);
  }

  /**
   * Info level - only logs in development
   * Use for general informational messages
   */
  info(...args: unknown[]) {
    this.log('info', ...args);
  }

  /**
   * Warning level - always logs
   * Use for warning messages that should be visible in production
   */
  warn(...args: unknown[]) {
    this.log('warn', ...args);
  }

  /**
   * Error level - always logs
   * Use for error messages that should be visible in production
   */
  error(...args: unknown[]) {
    this.log('error', ...args);
  }
}

/**
 * Singleton logger instance
 * 
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 * 
 * logger.debug('This only shows in development');
 * logger.info('This also only shows in development');
 * logger.warn('This always shows');
 * logger.error('This always shows');
 * ```
 */
export const logger = new Logger();
