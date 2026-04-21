import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as validator from 'validator';

@Injectable()
export class InputSanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize all input parameters
    req.body = this.sanitizeObject(req.body);
    req.query = this.sanitizeObject(req.query);
    req.params = this.sanitizeObject(req.params);
    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = typeof value === 'object' && value !== null 
        ? this.sanitizeObject(value) 
        : this.sanitizeValue(value);
    }
    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Escape HTML entities and remove low-order ASCII chars
      return validator.escape(validator.stripLow(value, true));
    }
    return value;
  }
}