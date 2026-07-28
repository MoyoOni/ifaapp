import { Module } from '@nestjs/common';
import { ServiceOfferingsController } from './service-offerings.controller';
import { ServiceOfferingsService } from './service-offerings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceOfferingsController],
  providers: [ServiceOfferingsService],
  exports: [ServiceOfferingsService],
})
export class ServiceOfferingsModule {}
