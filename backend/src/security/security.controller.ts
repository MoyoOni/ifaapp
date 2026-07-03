import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { SecurityConfigService } from './security-config.service';

@ApiTags('security')
@Controller('security')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityConfigService) {}

  @Get('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security configuration status' })
  @ApiResponse({
    status: 200,
    description: 'Security configuration report',
    schema: {
      type: 'object',
      properties: {
        cors: {
          type: 'object',
          properties: {
            origins: { type: 'array', items: { type: 'string' } },
            credentials: { type: 'boolean' },
          },
        },
        csp: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            directives: { type: 'object' },
          },
        },
        helmet: {
          type: 'object',
          properties: {
            hsts: { type: 'boolean' },
            frameguard: { type: 'string' },
          },
        },
        validation: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            errors: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async getSecurityConfig() {
    const corsConfig = this.securityService.getCorsConfig();
    const cspConfig = this.securityService.getCspConfig();
    const helmetConfig = this.securityService.getHelmetConfig();
    const validation = this.securityService.validateSecurityConfig();

    return {
      cors: {
        origins: Array.isArray(corsConfig.origin) ? corsConfig.origin : [corsConfig.origin],
        credentials: corsConfig.credentials,
        methods: corsConfig.methods,
      },
      csp: {
        enabled: true,
        directives: cspConfig.directives,
        reportOnly: cspConfig.reportOnly,
      },
      helmet: {
        hsts: helmetConfig.hsts.preload,
        frameguard: helmetConfig.frameguard.action,
        contentSecurityPolicy: !!helmetConfig.contentSecurityPolicy,
        referrerPolicy: helmetConfig.referrerPolicy.policy,
      },
      validation,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('headers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security headers applied to responses' })
  @ApiResponse({
    status: 200,
    description: 'Security headers configuration',
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  async getSecurityHeaders() {
    return this.securityService.getSecurityHeaders();
  }

  @Get('recommendations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security improvement recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Security recommendations',
    schema: {
      type: 'object',
      properties: {
        environment: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getSecurityRecommendations() {
    const validation = this.securityService.validateSecurityConfig();
    const recommendations: string[] = [];

    if (validation.environment === 'production') {
      if (validation.errors.length > 0) {
        recommendations.push(...validation.errors.map((e) => `❌ ${e}`));
      }

      if (validation.warnings.length > 0) {
        recommendations.push(...validation.warnings.map((w) => `⚠️  ${w}`));
      }

      if (validation.isValid && validation.errors.length === 0) {
        recommendations.push('✅ Security configuration is production-ready');
        recommendations.push('✅ CORS is properly restricted');
        recommendations.push('✅ CSP is enforced');
        recommendations.push('✅ All security headers are enabled');
      }
    } else {
      recommendations.push('ℹ️  Running in development mode');
      recommendations.push('💡 Some security features are relaxed for development convenience');
      recommendations.push('⚠️  Remember to tighten security in production');
    }

    return {
      environment: validation.environment,
      recommendations,
    };
  }
}
