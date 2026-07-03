import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { SearchProcessor } from './search.processor';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchService, SearchProcessor],
  exports: [SearchService],
})
export class SearchModule {}
