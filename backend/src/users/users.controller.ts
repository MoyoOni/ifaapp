import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('my/personal-awo')
  async getPersonalAwo(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.getPersonalAwo(currentUser.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser?: CurrentUserPayload) {
    // Only allow users to access their own profile unless they're an admin
    if (currentUser?.sub !== id && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    // Only allow users to update their own profile unless they're an admin
    if (currentUser?.sub !== id && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return this.usersService.update(id, dto, currentUser!);
  }

  @Public()
  @Patch(':id/onboarding')
  async completeOnboarding(
    @Param('id') id: string,
    @Body() onboardingData: Partial<UpdateUserDto>,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    // Only allow users to update their own onboarding unless they're an admin
    if (currentUser?.sub !== id && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return this.usersService.completeOnboarding(id, onboardingData, currentUser!);
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    if (currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }

    // Create filters object without 'limit' property which doesn't exist in FindAllFilters
    const filters: any = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (limit) filters.take = parseInt(limit, 10); // Changed from 'limit' to 'take'
    if (offset) filters.skip = parseInt(offset, 10); // Changed from 'offset' to 'skip'

    return this.usersService.findAll(filters);
  }
}
