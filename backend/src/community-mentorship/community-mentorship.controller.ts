import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CommunityMentorshipService } from './community-mentorship.service';
import { RequestCommunityMentorshipDto } from './dto/community-mentorship.dto';

@Controller('community-mentorship')
@UseGuards(JwtAuthGuard)
export class CommunityMentorshipController {
  constructor(private readonly communityMentorshipService: CommunityMentorshipService) {}

  @Get('mentors/available')
  async getAvailableMentors(@CurrentUser() user: CurrentUserPayload) {
    return this.communityMentorshipService.getAvailableMentors(user.id);
  }

  @Post('request')
  async requestMentorship(
    @Body() dto: RequestCommunityMentorshipDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.communityMentorshipService.requestMentorship(user.id, dto);
  }

  @Get('mine')
  async getMyMentorship(@CurrentUser() user: CurrentUserPayload) {
    return this.communityMentorshipService.getMyMentorship(user.id);
  }

  @Patch(':id/complete')
  async completeMentorship(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.communityMentorshipService.completeMentorship(id, user.id);
  }
}
