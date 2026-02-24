import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
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
