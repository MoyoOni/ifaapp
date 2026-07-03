import { Module } from '@nestjs/common';
import { BabalawoClientService } from './babalawo-client.service';
import { BabalawoClientController } from './babalawo-client.controller';

@Module({
  controllers: [BabalawoClientController],
  providers: [BabalawoClientService],
  exports: [BabalawoClientService],
})
export class BabalawoClientModule {}
