import { Injectable, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FriendlyErrorMessage {
  userMessage: string;
  technicalMessage: string;
  suggestion: string;
  errorCode: string;
}

@Injectable()
export class FriendlyErrorHandlerService {
  private readonly logger = new Logger(FriendlyErrorHandlerService.name);

  /**
   * Converts technical errors to user-friendly messages
   */
  convertToUserFriendly(error: any): FriendlyErrorMessage {
    this.logger.log(`Converting error to user-friendly format: ${error.message || error}`);

    // Handle different types of errors
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    }

    // Handle common Prisma errors
    if (error.code) {
      return this.handlePrismaError(error);
    }

    // Handle NestJS HTTP exceptions
    if (error.status && error.message) {
      return this.handleHttpException(error);
    }

    // Handle general errors
    return this.handleGeneralError(error);
  }

  /**
   * Handles validation errors and converts them to friendly messages
   */
  private handleValidationError(error: ValidationError): FriendlyErrorMessage {
    const constraints = error.constraints || {};
    const constraintKeys = Object.keys(constraints);

    if (constraintKeys.length > 0) {
      const firstConstraint = constraints[constraintKeys[0]];
      return {
        userMessage: `There's an issue with your input: ${firstConstraint}`,
        technicalMessage: `Validation failed: ${firstConstraint}`,
        suggestion: 'Please check the entered information and try again',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    return {
      userMessage: 'There was an issue with your request. Please check your input and try again.',
      technicalMessage: 'Validation error occurred',
      suggestion: 'Verify all required fields are filled correctly',
      errorCode: 'VALIDATION_ERROR_GENERAL',
    };
  }

  /**
   * Handles Prisma database errors
   */
  private handlePrismaError(error: any): FriendlyErrorMessage {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          userMessage: 'This information is already in use. Please try a different value.',
          technicalMessage: `Unique constraint violation: ${error.meta?.target?.join(', ')}`,
          suggestion: 'Choose a unique value for the conflicting field',
          errorCode: 'UNIQUE_CONSTRAINT_VIOLATION',
        };

      case 'P2003': // Foreign key constraint violation
        return {
          userMessage: 'The referenced item does not exist or has been removed.',
          technicalMessage: `Foreign key constraint violation: ${error.meta?.field_name}`,
          suggestion: 'Verify that the referenced item still exists',
          errorCode: 'FOREIGN_KEY_VIOLATION',
        };

      case 'P2025': // Record not found
        return {
          userMessage: 'The requested item could not be found.',
          technicalMessage: `Record not found: ${error.meta?.cause || 'Resource'}`,
          suggestion: 'Check the ID or search for a different item',
          errorCode: 'RECORD_NOT_FOUND',
        };

      case 'P2005': // Value too long for column
        return {
          userMessage: 'The provided information is too long.',
          technicalMessage: `Value too long: ${error.meta?.column_name}`,
          suggestion: 'Shorten your input and try again',
          errorCode: 'VALUE_TOO_LONG',
        };

      default:
        return {
          userMessage: 'An unexpected error occurred while processing your request.',
          technicalMessage: `Prisma error (${error.code}): ${error.message}`,
          suggestion: 'Please try again or contact support if the problem persists',
          errorCode: 'DATABASE_ERROR',
        };
    }
  }

  /**
   * Handles HTTP exceptions
   */
  private handleHttpException(error: any): FriendlyErrorMessage {
    const status = error.status;
    const message = error.message || 'Unknown error';

    switch (status) {
      case 400:
        return {
          userMessage: 'Your request contains invalid information.',
          technicalMessage: `Bad Request: ${message}`,
          suggestion: 'Correct the information and resubmit your request',
          errorCode: 'BAD_REQUEST',
        };

      case 401:
        return {
          userMessage: 'You need to sign in to perform this action.',
          technicalMessage: `Unauthorized: ${message}`,
          suggestion: 'Sign in to your account and try again',
          errorCode: 'UNAUTHORIZED',
        };

      case 403:
        return {
          userMessage: 'You do not have permission to perform this action.',
          technicalMessage: `Forbidden: ${message}`,
          suggestion: 'Contact an administrator if you believe you should have access',
          errorCode: 'FORBIDDEN',
        };

      case 404:
        return {
          userMessage: 'The page or resource you are looking for does not exist.',
          technicalMessage: `Not Found: ${message}`,
          suggestion: 'Check the URL or return to the home page',
          errorCode: 'NOT_FOUND',
        };

      case 429:
        return {
          userMessage: 'Too many requests. Please wait before trying again.',
          technicalMessage: `Rate Limited: ${message}`,
          suggestion: 'Wait a moment before making another request',
          errorCode: 'RATE_LIMITED',
        };

      case 500:
        return {
          userMessage: 'Something went wrong on our side. We\'re working to fix it.',
          technicalMessage: `Internal Server Error: ${message}`,
          suggestion: 'Try again later or contact support if the issue continues',
          errorCode: 'INTERNAL_SERVER_ERROR',
        };

      default:
        return {
          userMessage: `We encountered an error (${status}).`,
          technicalMessage: `HTTP ${status}: ${message}`,
          suggestion: 'Try again or contact support if the problem persists',
          errorCode: `HTTP_${status}_ERROR`,
        };
    }
  }

  /**
   * Handles general errors
   */
  private handleGeneralError(error: any): FriendlyErrorMessage {
    const message = error.message || 'An unknown error occurred';

    // Try to identify common error patterns
    if (message.includes('timeout')) {
      return {
        userMessage: 'The request took too long to complete. Please try again.',
        technicalMessage: `Request timeout: ${message}`,
        suggestion: 'Check your internet connection and try again',
        errorCode: 'REQUEST_TIMEOUT',
      };
    }

    if (message.includes('network') || message.includes('connect')) {
      return {
        userMessage: 'Unable to connect to our servers. Please check your internet connection.',
        technicalMessage: `Network error: ${message}`,
        suggestion: 'Verify your internet connection and try again',
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      userMessage: 'An unexpected error occurred. Our team has been notified.',
      technicalMessage: message,
      suggestion: 'Please try again or contact support if the problem persists',
      errorCode: 'GENERAL_ERROR',
    };
  }

  /**
   * Logs error details for debugging while showing friendly message to users
   */
  logErrorForDebugging(error: any, context: string, additionalData?: any) {
    this.logger.error(
      `Error in ${context}: ${error.message || error}`,
      {
        stack: error.stack,
        code: error.code,
        statusCode: error.status,
        additionalData,
      },
      error.constructor?.name || 'Error'
    );
  }
}