import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '@ile-ase/common';
import { CirclesService } from './circles.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CreateCircleSuggestionDto } from './dto/create-circle-suggestion.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  /**
   * Create a new circle
   * POST /circles
   * Only admins can create circles
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCircleDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.create(dto, currentUser);
  }

  /**
   * Freeform "suggest a new circle" -- any logged-in user.
   * POST /circles/suggestions
   */
  @Post('suggestions')
  @UseGuards(AuthGuard('jwt'))
  async suggest(
    @Body() dto: CreateCircleSuggestionDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.suggestCircle(dto, currentUser);
  }

  /**
   * Get all circles (with optional filters)
   * GET /circles?search=...&privacy=...&topic=...&location=...
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('privacy') privacy?: string,
    @Query('topic') topic?: string,
    @Query('location') location?: string,
    @Query('active') active?: string
  ) {
    return this.circlesService.findAll({
      search,
      privacy,
      topic,
      location,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  /**
   * Get circle by ID or slug
   * GET /circles/:identifier
   */
  @Get(':identifier')
  async findOne(
    @Param('identifier') identifier: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.circlesService.findOne(identifier, currentUser);
  }

  /**
   * Update circle
   * PATCH /circles/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') circleId: string,
    @Body() dto: UpdateCircleDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.update(circleId, dto, currentUser);
  }

  /**
   * Delete circle
   * DELETE /circles/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.delete(circleId, currentUser);
  }

  /**
   * Join a circle
   * POST /circles/:id/join
   */
  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  async joinCircle(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.joinCircle(circleId, currentUser);
  }

  /**
   * Leave a circle
   * POST /circles/:id/leave
   */
  @Post(':id/leave')
  @UseGuards(AuthGuard('jwt'))
  async leaveCircle(@Param('id') circleId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.circlesService.leaveCircle(circleId, currentUser);
  }

  /**
   * POST /circles/:id/become-patron
   */
  @Post(':id/become-patron')
  @UseGuards(AuthGuard('jwt'))
  async becomePatron(
    @Param('id') circleId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.becomePatron(circleId, currentUser);
  }

  /**
   * Get user's circles
   * GET /circles/user/:userId
   */
  @Get('user/:userId')
  async getUserCircles(@Param('userId') userId: string) {
    return this.circlesService.getUserCircles(userId);
  }

  // ==================== D5: Circle Feed ====================

  @Get(':id/feed')
  @UseGuards(AuthGuard('jwt'))
  async getCircleFeed(
    @Param('id') circleId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.getCircleFeed(circleId, currentUser.id);
  }

  @Post(':id/feed')
  @UseGuards(AuthGuard('jwt'))
  async createCircleFeedPost(
    @Param('id') circleId: string,
    @Body() body: { content: string; patronOnly?: boolean },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.createCircleFeedPost(
      circleId,
      body.content,
      body.patronOnly ?? false,
      currentUser
    );
  }

  @Post('feed/:postId/like')
  @UseGuards(AuthGuard('jwt'))
  async toggleFeedPostLike(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.toggleFeedPostLike(postId, currentUser.id);
  }

  @Get('feed/:postId/comments')
  @UseGuards(AuthGuard('jwt'))
  async getFeedPostComments(@Param('postId') postId: string) {
    return this.circlesService.getFeedPostComments(postId);
  }

  @Post('feed/:postId/comments')
  @UseGuards(AuthGuard('jwt'))
  async addFeedPostComment(
    @Param('postId') postId: string,
    @Body() body: { content: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.addFeedPostComment(postId, currentUser.id, body.content);
  }

  @Post('feed/:postId/report')
  @UseGuards(AuthGuard('jwt'))
  async reportFeedPost(
    @Param('postId') postId: string,
    @Body() body: { reason: string; note?: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.reportFeedPost(postId, body.reason, body.note, currentUser);
  }

  @Get('feed/reports')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async getFeedReports(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Query('status') status?: string
  ) {
    return this.circlesService.getFeedReports(currentUser, status);
  }

  @Patch('feed/reports/:reportId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async reviewFeedReport(
    @Param('reportId') reportId: string,
    @Body() body: { action: 'dismiss' | 'hide_post' | 'warn_user' },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.circlesService.reviewFeedReport(reportId, body.action, currentUser);
  }
}
