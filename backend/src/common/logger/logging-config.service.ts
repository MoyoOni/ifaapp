import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

@Injectable()
export class LoggingConfigService {
  createLogger(level: string = 'info'): winston.Logger {
    return winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            nestWinstonModuleUtilities.format.nestLike('IFA-APP', {
              prettyPrint: true,
            }),
          ),
        }),
        ...(process.env.NODE_ENV === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ]
          : []),
      ],
    });
  }
}