import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ConsentController],
  providers: [ConsentService, PrismaService],
  exports: [ConsentService],
})
export class ConsentModule {}