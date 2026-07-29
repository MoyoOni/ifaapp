import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { HealingService } from './healing.service';
import { ReportHealingCaseDto, ResolveHealingCaseDto, UpdateElderNotesDto } from './dto/healing.dto';

@Controller('healing')
@UseGuards(JwtAuthGuard)
export class HealingController {
  constructor(private readonly healingService: HealingService) {}

  @Post('cases')
  async report(@Body() dto: ReportHealingCaseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.healingService.report(dto, user.id);
  }

  @Get('cases/mine')
  async findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.healingService.findMine(user.id);
  }

  @Get('cases/queue')
  async findQueue(@CurrentUser() user: CurrentUserPayload) {
    return this.healingService.findQueue(user.id);
  }

  @Get('cases/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.healingService.findOne(id, user.id, user.role);
  }

  @Patch('cases/:id/assign')
  async assign(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.healingService.assign(id, user.id);
  }

  @Patch('cases/:id/resolve')
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveHealingCaseDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.healingService.resolve(id, dto, user.id, user.role === 'ADMIN');
  }

  @Patch('cases/:id/elder-notes')
  async updateElderNotes(
    @Param('id') id: string,
    @Body() dto: UpdateElderNotesDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.healingService.updateElderNotes(id, user.id, user.role === 'ADMIN', dto);
  }
}
