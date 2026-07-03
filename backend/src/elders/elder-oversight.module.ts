import { Module } from '@nestjs/common';
import { ElderOversightService } from './elder-oversight.service';
import { ElderOversightController } from './elder-oversight.controller';

@Module({
  controllers: [ElderOversightController],
  providers: [ElderOversightService],
  exports: [ElderOversightService],
})
export class ElderOversightModule {}