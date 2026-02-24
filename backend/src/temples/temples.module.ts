import { Module } from '@nestjs/common';
import { TemplesController } from './temples.controller';
import { TemplesService } from './temples.service';

@Module({
  controllers: [TemplesController],
  providers: [TemplesService],
  exports: [TemplesService],
})
export class TemplesModule {}
