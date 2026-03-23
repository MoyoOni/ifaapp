import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { initSentry } from './sentry';
import { AppModule } from './app.module';
import { SecurityConfigService } from './security/security-config.service';

const logger = new Logger('Bootstrap');

initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Get security configuration service
  const securityService = app.get(SecurityConfigService);
  const configService = app.get(ConfigService);

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
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for flexibility
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        logger.warn('Validation errors:', JSON.stringify(errors, null, 2));
        return new ValidationPipe({}).createExceptionFactory()(errors);
      },
    })
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Ìlé Àṣẹ API')
    .setDescription(
      'The spiritual connectivity platform for Ifá practitioners and the African diaspora.'
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('academy', 'Learning & Courses')
    .addTag('temples', 'Traditional Temples')
    .addTag('marketplace', 'Spiritual Items & Services')
    .addTag('messaging', 'Secure Spiritual Communication')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable graceful shutdown hooks
  // This ensures NestJS drains in-flight requests, closes DB connections,
  // and shuts down BullMQ workers cleanly before the process exits.
  app.enableShutdownHooks();

  // Handle PM2/Docker SIGINT/SIGTERM gracefully
  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}. Starting graceful shutdown...`);
    await app.close();
    logger.log('Application shut down gracefully.');
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`Ilé Àṣẹ Backend running on: http://localhost:${port}/api`);
}

bootstrap();
