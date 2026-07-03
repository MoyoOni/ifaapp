import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Security Configuration Service
 * Manages CORS, CSP, and other security headers
 */
@Injectable()
export class SecurityConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Get CORS configuration based on environment
   */
  getCorsConfig() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');

    // In production, require explicit CORS configuration
    if (nodeEnv === 'production') {
      const allowedOrigins = this.configService.get<string>('CORS_ALLOWED_ORIGINS');

      if (!allowedOrigins) {
        throw new Error('CORS_ALLOWED_ORIGINS is required in production environment');
      }

      const origins = allowedOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

      return {
        origin: origins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Accept',
          'Authorization',
          'Content-Type',
          'X-Requested-With',
          'X-CSRF-Token',
          'X-Request-ID',
        ],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400, // 24 hours
      };
    }

    // Development configuration
    return {
      origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID'],
    };
  }

  /**
   * Get Content Security Policy configuration
   */
  getCspConfig() {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    // Base CSP directives
    const baseDirectives: any = {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameAncestors: ["'none'"], // Prevent clickjacking
      imgSrc: [
        "'self'",
        'data:',
        'https://*.s3.amazonaws.com',
        'https://*.cloudinary.com',
        'https://lh3.googleusercontent.com', // Google OAuth avatars
        'https://platform-lookaside.fbsbx.com', // Facebook avatars
      ],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      upgradeInsecureRequests: [],
    };

    // Production-specific restrictions
    if (nodeEnv === 'production') {
      // Remove development allowances
      const prodDirectives: any = { ...baseDirectives };
      prodDirectives.scriptSrc = ["'self'"];
      prodDirectives.styleSrc = ["'self'"];

      return {
        directives: prodDirectives,
        reportOnly: false,
      };
    }

    // Development configuration (more permissive)
    return {
      directives: baseDirectives,
      reportOnly: true, // Don't block in development, just report violations
    };
  }

  /**
   * Get Helmet security configuration
   */
  getHelmetConfig(): any {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    return {
      contentSecurityPolicy: this.getCspConfig(),
      dnsPrefetchControl: {
        allow: false,
      },
      expectCt: {
        enforce: nodeEnv === 'production',
        maxAge: 86400, // 24 hours
      },
      frameguard: {
        action: 'deny' as const, // Prevent clickjacking
      },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: nodeEnv === 'production',
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin' as const,
      },
      xssFilter: true,
    };
  }

  /**
   * Get security headers for API responses
   */
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': [
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
      ].join(', '),
    };
  }

  /**
   * Validate security configuration
   */
  validateSecurityConfig(): SecurityValidationResult {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const errors: string[] = [];
    const warnings: string[] = [];

    // Production security requirements
    if (nodeEnv === 'production') {
      // CORS validation
      const corsOrigins = this.configService.get<string>('CORS_ALLOWED_ORIGINS');
      if (!corsOrigins) {
        errors.push('CORS_ALLOWED_ORIGINS is required in production');
      } else {
        const origins = corsOrigins.split(',').map((o) => o.trim());
        if (origins.includes('*') || origins.includes('http://localhost:*')) {
          errors.push('Wildcard CORS origins not allowed in production');
        }
      }

      // HTTPS requirement
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (frontendUrl && !frontendUrl.startsWith('https://')) {
        warnings.push('FRONTEND_URL should use HTTPS in production');
      }
    }

    // Development warnings
    if (nodeEnv === 'development') {
      warnings.push('Running in development mode - security settings are relaxed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      environment: nodeEnv,
    };
  }
}

// Types
export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: string;
}
