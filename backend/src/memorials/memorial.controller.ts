import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { MemorialService } from './memorial.service';
import { CreateMemorialDto } from './dto/memorial.dto';

@Controller('memorials')
@UseGuards(JwtAuthGuard)
export class MemorialController {
  constructor(private readonly memorialService: MemorialService) {}

  @Post()
  async create(@Body() dto: CreateMemorialDto, @CurrentUser() user: CurrentUserPayload) {
    return this.memorialService.create(dto, user.id);
  }

  @Get()
  @Public()
  async findPublic(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.memorialService.findPublic(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.memorialService.delete(id, user.id, user.role === 'ADMIN');
  }
}
