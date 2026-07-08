import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RecordQuizAttemptDto } from './dto/record-quiz-attempt.dto';
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

  // F9-902: Cultural Onboarding Gate. Must stay registered before @Get(':id')
  // -- Express/Nest match routes in registration order, so 'quiz/questions'
  // would otherwise be swallowed as if it were an :id lookup.
  @Get('quiz/questions')
  async getQuizQuestions() {
    return this.usersService.getActiveQuizQuestions();
  }

  @Post(':id/quiz-attempt')
  async recordQuizAttempt(
    @Param('id') id: string,
    @Body() dto: RecordQuizAttemptDto,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    if (currentUser?.sub !== id && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    await this.usersService.recordQuizAttempt(id, dto.passed);
    return { success: true };
  }

  // EXP-027: Referral stats for the authenticated user. Also must stay
  // registered before @Get(':id') for the same route-ordering reason above.
  @Get('referral-stats')
  async getReferralStats(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.usersService.getReferralStats(currentUser.sub);
  }

  // Any authenticated user can view any profile -- this is the public profile
  // page, not an account-settings lookup (that's the same route, but
  // findOne() itself strips email/phone unless the viewer is the owner).
  // Previously this threw Forbidden for anyone but the owner/an admin, which
  // silently broke viewing anyone else's profile at all, and never passed a
  // viewerId through -- so profile-view logging and the isOwnProfile-gated
  // personalAwo data never worked even for the owner's own profile.
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser?: CurrentUserPayload) {
    return this.usersService.findOne(id, currentUser?.sub);
  }

  // EXP-029: badges are shown on public profiles -- intentionally viewable
  // by any authenticated user, not restricted to self/admin like findOne().
  @Get(':id/badges')
  async getBadges(@Param('id') id: string) {
    return this.usersService.getUserBadges(id);
  }

  // "Who viewed my profile" -- private, self/admin only (unlike badges).
  // getProfileViewers() and the ProfileView logging that feeds it were fully
  // built but had no route calling either; profile views were never actually
  // recorded until findOne() above started passing a viewerId through.
  @Get(':id/profile-viewers')
  async getProfileViewers(
    @Param('id') id: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    if (currentUser?.sub !== id && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException();
    }
    return this.usersService.getProfileViewers(id);
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
