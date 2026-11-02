import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupportResourcesService } from './support-resources.service';
import { SupportResourcesController } from './support-resources.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SupportResourcesController],
  providers: [SupportResourcesService],
})
export class SupportResourcesModule {}
