import { Module } from '@nestjs/common';
import { DatabaseOptimizationService } from './database-optimization.service';
import { DatabaseOptimizationController } from './database-optimization.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DatabaseOptimizationController],
  providers: [DatabaseOptimizationService, PrismaService],
  exports: [DatabaseOptimizationService],
})
export class DatabaseModule {}
