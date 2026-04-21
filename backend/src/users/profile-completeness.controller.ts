import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../shared/guards/auth.guard'; // Correct import path
import { ProfileCompletenessService } from './profile-completeness.service';

@ApiTags('Profile Completeness')
@Controller('profile-completeness')
export class ProfileCompletenessController {
  constructor(
    private readonly profileCompletenessService: ProfileCompletenessService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  @ApiOperation({ summary: 'Get profile completeness for a user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the profile completeness information for the user.' 
  })
  async getProfileCompleteness(@Param('userId') userId: string) {
    return this.profileCompletenessService.calculateProfileCompleteness(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':userId/next-steps')
  @ApiOperation({ summary: 'Get recommended next steps for profile completion' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns recommended next steps to improve profile completeness.' 
  })
  async getNextSteps(@Param('userId') userId: string) {
    return this.profileCompletenessService.getNextSteps(userId);
  }
}