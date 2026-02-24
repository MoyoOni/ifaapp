import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import { initSentry } from './sentry';
// import { SentryExceptionFilter } from './filters/sentry-exception.filter';
import { AppModule } from './app.module';
import { SecurityConfigService } from './security/security-config.service';

const logger = new Logger('Bootstrap');

// initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get security configuration service
  const securityService = app.get(SecurityConfigService);
  const configService = app.get(ConfigService);

  // app.useGlobalFilters(new SentryExceptionFilter());

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

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`Ilé Àṣẹ Backend running on: http://localhost:${port}/api`);
}

bootstrap();
