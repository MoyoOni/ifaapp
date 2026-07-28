import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { DreamService } from './dream.service';
import { CreateDreamDto, InterpretDreamDto } from './dto/dream.dto';

@Controller('dreams')
@UseGuards(JwtAuthGuard)
export class DreamController {
  constructor(private readonly dreamService: DreamService) {}

  @Post()
  async create(@Body() dto: CreateDreamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.dreamService.create(dto, user.id);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.dreamService.findMine(user.id);
  }

  @Get('shared')
  @Public()
  async findShared(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.dreamService.findShared(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get('interpretation-requests')
  async findInterpretationRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.dreamService.findInterpretationRequests(user.role);
  }

  @Post(':id/interpret')
  async interpret(
    @Param('id') id: string,
    @Body() dto: InterpretDreamDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.dreamService.interpret(id, dto, user.id, user.role);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.dreamService.delete(id, user.id, user.role === 'ADMIN');
  }
}
