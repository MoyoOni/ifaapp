import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WellbeingService } from './wellbeing.service';
import { RequestCheckInDto } from './dto/wellbeing.dto';

@Controller('wellbeing')
@UseGuards(JwtAuthGuard)
export class WellbeingController {
  constructor(private readonly wellbeingService: WellbeingService) {}

  @Post('check-in')
  async requestCheckIn(@Body() dto: RequestCheckInDto, @CurrentUser() user: CurrentUserPayload) {
    return this.wellbeingService.requestCheckIn(user.id, dto);
  }

  @Get('check-ins/mine')
  async getMyCheckIns(@CurrentUser() user: CurrentUserPayload) {
    return this.wellbeingService.getMyCheckIns(user.id);
  }

  @Get('check-ins')
  async getQueue(@CurrentUser() user: CurrentUserPayload) {
    return this.wellbeingService.getQueue(user.id);
  }

  @Patch('check-ins/:id/claim')
  async claim(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.wellbeingService.claim(id, user.id);
  }

  @Patch('check-ins/:id/resolve')
  async resolve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.wellbeingService.resolve(id, user.id);
  }
}
