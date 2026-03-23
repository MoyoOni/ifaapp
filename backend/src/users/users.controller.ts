import { Controller, Get, Patch, Param, Body, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Query('role') role?: string,
    @Query('verified') verified?: string,
    @Query('search') search?: string
  ) {
    return this.usersService.findAll({ role, verified, search });
  }

  @Get('me')
  async getMe(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.findOne(currentUser.id);
  }

  @Get('referral-stats')
  async getReferralStats(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.getReferralStats(currentUser.id);
  }

  @Get('profile-views/mine')
  async getMyProfileViews(@CurrentUser() currentUser: CurrentUserPayload) {
    // Check Devoted subscription
    const profile = await this.usersService.findOne(currentUser.id);
    if ((profile as any).subscriptionStatus !== 'DEVOTED') {
      throw new ForbiddenException('Profile view history is a Devoted member benefit.');
    }
    return this.usersService.getProfileViewers(currentUser.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.findOne(id, currentUser.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Patch(':id/onboarding')
  async completeOnboarding(
    @Param('id') id: string,
    @Body() onboardingData: Record<string, unknown>,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    // Users can only complete their own onboarding
    if (currentUser.id !== id) {
      throw new Error('You can only complete your own onboarding');
    }
    return this.usersService.completeOnboarding(id, onboardingData);
  }
}
