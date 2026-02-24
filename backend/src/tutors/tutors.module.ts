import { Module } from '@nestjs/common';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Tutors Module
 * Manages tutor profiles and session bookings
 */
@Module({
  imports: [PrismaModule],
  controllers: [TutorsController],
  providers: [TutorsService],
  exports: [TutorsService],
})
export class TutorsModule {}
