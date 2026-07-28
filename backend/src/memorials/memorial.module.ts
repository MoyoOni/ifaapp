import { Module } from '@nestjs/common';
import { MemorialService } from './memorial.service';
import { MemorialController } from './memorial.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MemorialController],
  providers: [MemorialService],
  exports: [MemorialService],
})
export class MemorialModule {}
