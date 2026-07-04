import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as validator from 'validator';

@Injectable()
export class InputSanitizationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // req.body is a plain writable property, but req.query is a getter-only
    // accessor on this Express/router version -- reassigning it outright
    // throws "Cannot set property query of #<IncomingMessage> which has
    // only a getter". Mutate query/params in place instead.
    req.body = this.sanitizeObject(req.body);
    this.sanitizeInPlace(req.query);
    this.sanitizeInPlace(req.params);
    next();
  }

  private sanitizeInPlace(obj: Record<string, any>): void {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      obj[key] =
        typeof value === 'object' && value !== null
          ? this.sanitizeObject(value)
          : this.sanitizeValue(value);
    }
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeValue(obj);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] =
        typeof value === 'object' && value !== null
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
