
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SecurityConfigService } from './security/security-config.service';
import { SecurityHardeningService } from './security/security-hardening.service';
import { InputSanitizationMiddleware } from './middleware/input-sanitization.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { SensitiveFieldStripInterceptor } from './interceptors/sensitive-field-strip.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const logger = new Logger('Bootstrap');

// Note: Sentry initialization is now handled by SentryInitializerService in the app module
// This ensures it's properly managed by the NestJS lifecycle

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Get security configuration service
  const securityService = app.get(SecurityConfigService);
  const configService = app.get(ConfigService);

  // Initialize security hardening checks
  const securityHardeningService = app.get(SecurityHardeningService);
  try {
    await securityHardeningService.validateSecurityConfiguration();
    await securityHardeningService.implementOWASPTop10Measures();
    await securityHardeningService.performGDPRComplianceChecks();
    await securityHardeningService.verifyRateLimitingConfiguration();
    await securityHardeningService.optimizeConnectionPooling();
    logger.log('Security hardening checks completed successfully');
  } catch (error) {
    logger.error('Security hardening validation failed:', error);
    process.exit(1); // Exit if security validation fails
  }

  // Apply security middlewares in order
  app.use(new InputSanitizationMiddleware().use);
  app.use(new SecurityHeadersMiddleware().use);

  // Security middleware with enhanced configuration
  const helmetConfig = securityService.getHelmetConfig();
  app.use(helmet(helmetConfig));

  // Add additional security headers
  app.use((req: any, res: any, next: any) => {
    const securityHeaders = securityService.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });

  // CORS with enhanced configuration
  app.enableCors(securityService.getCorsConfig());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips properties not included in DTOs
      forbidNonWhitelisted: false, // Allows properties not in DTOs but strips them
      transform: true, // Transforms payloads to DTO instances
      disableErrorMessages: false, // Keep error messages for debugging
    }),
  );

  // P0-04: global response safety net — strips passwordHash/emailVerificationToken
  // from every response body, however deeply nested, regardless of whether the
  // specific controller remembered to do it by hand. See the interceptor's own
  // doc comment for why this exists instead of a per-endpoint DTO layer.
  app.useGlobalInterceptors(new SensitiveFieldStripInterceptor());

  // P1-03 discovery: three separate global exception filters existed
  // (GlobalExceptionFilter, SentryExceptionFilter, FriendlyExceptionFilter)
  // but none was ever registered — every error response has always used
  // Nest's bare default shape ({statusCode, message}) instead of the
  // { success: false, error: StandardApiError } shape the frontend's
  // parseApiError() has been written against since PB-202.5. This wires up
  // the one with the richest Prisma/JWT error mapping (now Sentry-reporting
  // too); the other two were unused duplicates and have been removed.
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger setup for development
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Ìlú Àṣẹ API')
      .setDescription('API for the Ìlú Àṣẹ platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  if (configService.get('NODE_ENV') !== 'production') {
    logger.log(`Swagger documentation available at: http://localhost:${port}/api-docs`);
  }
}
bootstrap();