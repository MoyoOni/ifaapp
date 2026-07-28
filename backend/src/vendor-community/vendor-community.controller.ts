import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { VendorCommunityService } from './vendor-community.service';
import { RequestMentorshipDto, RequestSpiritualLeaveDto } from './dto/vendor-community.dto';

@Controller('vendor-community')
@UseGuards(JwtAuthGuard)
export class VendorCommunityController {
  constructor(private readonly vendorCommunityService: VendorCommunityService) {}

  @Get('mentors/available')
  async getAvailableMentors(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorCommunityService.getAvailableMentors(user.id);
  }

  @Post('mentorship/request')
  async requestMentorship(
    @Body() dto: RequestMentorshipDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.vendorCommunityService.requestMentorship(user.id, dto);
  }

  @Get('mentorship/mine')
  async getMyMentorship(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorCommunityService.getMyMentorship(user.id);
  }

  @Patch('mentorship/:id/complete')
  async completeMentorship(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.vendorCommunityService.completeMentorship(id, user.id);
  }

  @Post('spiritual-leave')
  async requestSpiritualLeave(
    @Body() dto: RequestSpiritualLeaveDto,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.vendorCommunityService.requestSpiritualLeave(user.id, dto);
  }

  @Get('spiritual-leave/mine')
  async getMySpiritualLeaves(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorCommunityService.getMySpiritualLeaves(user.id);
  }

  @Get('apprenticeship-progress')
  async getApprenticeshipProgress(@CurrentUser() user: CurrentUserPayload) {
    return this.vendorCommunityService.getApprenticeshipProgress(user.id);
  }
}
