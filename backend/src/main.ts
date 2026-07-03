
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