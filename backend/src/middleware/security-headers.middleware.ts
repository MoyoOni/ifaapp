import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection in compatible browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Set a strict referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Disable embedding in frames from other origins
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none';");

    // Set HSTS header for HTTPS enforcement
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Prevent the use of some dangerous APIs
    res.setHeader(
      'Permissions-Policy',
      [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'accelerometer=()',
        'gyroscope=()',
        'magnetometer=()',
        'fullscreen=(self)',
        'display-capture=()',
      ].join(', ')
    );

    next();
  }
}
