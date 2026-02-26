import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CacheModule } from '../cache/cache.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [CacheModule, SearchModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
