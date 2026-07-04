import { Module, Global } from '@nestjs/common';
import { LoggingConfigService } from './logging-config.service';
import { StructuredLoggerService } from './structured-logger.service';
import { LoggerMiddleware } from './logger.middleware';

@Global()
@Module({
  providers: [LoggingConfigService, StructuredLoggerService],
  exports: [LoggingConfigService, StructuredLoggerService],
})
export class LoggerModule {}
