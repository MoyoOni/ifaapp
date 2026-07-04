/**
 * Error Handler Utility
 * Provides centralized error handling and logging capabilities for the IFA application
 */
import { logger } from '@/shared/utils/logger';

interface ErrorDetails {
  message: string;
  stack?: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  userId?: string;
  customData?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private loggers: Array<(details: ErrorDetails) => void> = [];

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Adds a logger function to handle error details
   */
  public addLogger(logger: (details: ErrorDetails) => void): void {
    this.loggers.push(logger);
  }

  /**
   * Logs an error with optional custom data
   */
  public logError(error: Error | string, customData?: Record<string, unknown>): void {
    const errorDetails: ErrorDetails = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      userId: this.getCurrentUserId(),
      customData,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error Details:', errorDetails);
    }

    // Call all registered loggers
    this.loggers.forEach(logger => logger(errorDetails));
  }

  /**
   * Handles an error and logs it appropriately
   */
  public handleError(error: Error | string, customData?: Record<string, unknown>): void {
    this.logError(error, customData);
  }

  /**
   * Gets the current user ID if available
   */
  private getCurrentUserId(): string | undefined {
    // This would integrate with your authentication system
    // For now, returning a placeholder
    try {
      if (typeof window !== 'undefined') {
        // Example: Get user ID from auth context or storage
        // const authState = localStorage.getItem('authState');
        // return authState ? JSON.parse(authState).userId : undefined;
        return undefined; // Placeholder
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Reports an error to external service (placeholder implementation)
   */
  public reportError(error: Error | string, customData?: Record<string, unknown>): void {
    // In a real implementation, this would send errors to services like Sentry, Bugsnag, etc.
    logger.warn('Reporting error to external service (placeholder)', {
      error: typeof error === 'string' ? error : error.message,
      customData,
    });
  }
}

// Create a singleton instance
const errorHandler = ErrorHandler.getInstance();

// Export default instance
export default errorHandler;

// Export types
export type { ErrorDetails };