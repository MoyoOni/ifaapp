import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL');
    } catch (error) {
      this.logger.error(
        'Failed to connect to PostgreSQL — endpoints requiring DB will return 503',
        error instanceof Error ? error.message : String(error),
      );
      // Do NOT throw — let the app start so health endpoints and non-DB routes still work.
      // The GlobalExceptionFilter will catch PrismaClientInitializationError on DB calls
      // and return 503 instead of crashing the whole process.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
