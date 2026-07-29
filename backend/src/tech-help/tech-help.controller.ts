import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { TechHelpService } from './tech-help.service';
import { AskTechHelpDto, AnswerTechHelpDto } from './dto/tech-help.dto';

@Controller('tech-help')
@UseGuards(JwtAuthGuard)
export class TechHelpController {
  constructor(private readonly techHelpService: TechHelpService) {}

  @Post('requests')
  async ask(@Body() dto: AskTechHelpDto, @CurrentUser() user: CurrentUserPayload) {
    return this.techHelpService.ask(dto, user.id, user.role);
  }

  @Get('requests')
  async findOpen() {
    return this.techHelpService.findOpen();
  }

  @Get('requests/mine')
  async findMine(@CurrentUser() user: CurrentUserPayload) {
    return this.techHelpService.findMine(user.id);
  }

  @Patch('requests/:id/answer')
  async answer(
    @Param('id') id: string,
    @Body() dto: AnswerTechHelpDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.techHelpService.answer(id, dto, user.id);
  }
}
