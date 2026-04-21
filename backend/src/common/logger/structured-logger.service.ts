import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { Request } from 'express';
import { SentryService } from '../../sentry/sentry.service';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  error?: any;
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService implements LoggerService {
  private readonly logger = console; // In production, this would likely be replaced with a more sophisticated logger like Winston

  constructor(
    @Inject(REQUEST) private readonly request?: Request,
    private readonly sentryService?: SentryService,
  ) {}

  log(message: any, context?: LogContext): any {
    const logEntry = this.buildLogEntry('log', message, context);
    this.logger.log(JSON.stringify(logEntry));
    
    // For informational messages, we might not want to send to Sentry
    if (this.sentryService && typeof message === 'object' && message.level === 'error') {
      this.sentryService.captureMessage(JSON.stringify(logEntry));
    }
  }

  error(message: any, context?: LogContext): any {
    const logEntry = this.buildLogEntry('error', message, context);
    this.logger.error(JSON.stringify(logEntry));
    
    // Send errors to Sentry if available
    if (this.sentryService) {
      this.sentryService.captureException(message, {
        contexts: context || {},
        extra: logEntry,
      });
    }
  }

  warn(message: any, context?: LogContext): any {
    const logEntry = this.buildLogEntry('warn', message, context);
    this.logger.warn(JSON.stringify(logEntry));
    
    // Optionally send warnings to Sentry as well
    if (this.sentryService) {
      this.sentryService.captureMessage(JSON.stringify(logEntry), 'warning');
    }
  }

  debug?(message: any, context?: LogContext): any {
    if (process.env.NODE_ENV === 'production') {
      return; // Skip debug logs in production
    }
    
    const logEntry = this.buildLogEntry('debug', message, context);
    this.logger.debug(JSON.stringify(logEntry));
  }

  verbose?(message: any, context?: LogContext): any {
    if (process.env.NODE_ENV === 'production') {
      return; // Skip verbose logs in production
    }
    
    const logEntry = this.buildLogEntry('verbose', message, context);
    this.logger.log(JSON.stringify(logEntry)); // Using console.log for verbose since there's no console.verbose
  }

  private buildLogEntry(level: string, message: any, context?: LogContext): object {
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      service: 'backend',
      environment: process.env.NODE_ENV || 'development',
    };

    // Add request context if available
    if (this.request) {
      logEntry.context = {
        method: this.request.method,
        url: this.request.url,
        ip: this.request.ip,
        userAgent: this.request.get('User-Agent'),
        ...context,
      };
    } else {
      logEntry.context = context;
    }

    // Add correlation IDs if present in headers
    if (this.request?.headers) {
      const traceId = this.request.headers['x-trace-id'] || this.request.headers['x-request-id'];
      if (traceId) {
        logEntry.traceId = Array.isArray(traceId) ? traceId[0] : traceId;
      }
    }

    // Add process information
    logEntry.process = {
      pid: process.pid,
      memory: process.memoryUsage(),
    };

    return logEntry;
  }

  /**
   * Adds a correlation ID to the logger context
   */
  setRequestId(requestId: string): void {
    if (this.request) {
      (this.request as any).requestId = requestId;
    }
  }

  /**
   * Creates a child logger with additional context
   */
  child(context: LogContext): StructuredLoggerService {
    const childLogger = new StructuredLoggerService(this.request, this.sentryService);
    // We could enhance this to carry forward context
    return childLogger;
  }
}