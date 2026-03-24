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
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';

@Controller('forum')
@UseGuards(JwtAuthGuard)
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ==================== Trending ====================

  @Public()
  @Get('trending')
  async getTrendingThreads(@Query('limit') limit?: string) {
    return this.forumService.getTrendingThreads(limit ? parseInt(limit, 10) : 5);
  }

  @Get('admin/stats')
  async getForumStats(@CurrentUser() currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return this.forumService.getForumStats();
  }

  // F9-903: Detailed Forum Health Metrics
  @Get('admin/metrics')
  async getDetailedMetrics(
    @Query('period') period?: '7d' | '30d' | '90d',
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    if (currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }
    return this.forumService.getDetailedMetrics(period || '7d');
  }

  @Public()
  @Get('search')
  async searchForum(
    @Query('q') q: string,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ) {
    return this.forumService.searchForum(q ?? '', currentUser ?? null);
  }

  // ==================== Categories ====================

  @Public()
  @Get('categories')
  async findAllCategories() {
    return this.forumService.findAllCategories();
  }

  @Public()
  @Get('categories/:slug')
  async findCategoryBySlug(@Param('slug') slug: string) {
    return this.forumService.findCategoryBySlug(slug);
  }

  @Post('categories')
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.createCategory(dto, currentUser);
  }

  // ==================== Threads ====================

  @Public()
  @Get('threads')
  async findAllThreads(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('tag') tag?: string,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ) {
    return this.forumService.findAllThreads(categoryId, status, tag, currentUser ?? null);
  }

  @Public()
  @Get('threads/:id')
  async findThreadById(
    @Param('id') id: string,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ) {
    return this.forumService.findThreadById(id, currentUser ?? null);
  }

  @Post('threads')
  async createThread(@Body() dto: CreateThreadDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.createThread(dto, currentUser);
  }

  @Patch('threads/:id')
  async updateThread(
    @Param('id') id: string,
    @Body() dto: UpdateThreadDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.updateThread(id, dto, currentUser);
  }

  @Delete('threads/:id')
  async deleteThread(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.deleteThread(id, currentUser);
  }

  @Patch('threads/:id/sacred')
  @HttpCode(HttpStatus.OK)
  async setThreadSacred(
    @Param('id') id: string,
    @Body() body: { isSacred: boolean; reason?: string },
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can designate sacred content');
    }
    return this.forumService.updateThread(id, { isSacred: body.isSacred }, currentUser);
  }

  // ==================== Posts ====================

  @Get('threads/:threadId/posts')
  async findAllPosts(
    @Param('threadId') threadId: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.forumService.findAllPosts(threadId, currentUser);
  }

  @Get('posts/:id')
  async findPostById(@Param('id') id: string) {
    return this.forumService.findPostById(id);
  }

  @Post('posts')
  async createPost(@Body() dto: CreatePostDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.createPost(dto, currentUser);
  }

  @Patch('posts/:id')
  async updatePost(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.updatePost(id, dto, currentUser);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.deletePost(id, currentUser);
  }

  // ==================== Acknowledgments ====================

  @Post('posts/:postId/acknowledge')
  async acknowledgePost(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.acknowledgePost(postId, currentUser);
  }

  @Delete('posts/:postId/acknowledge')
  async unacknowledgePost(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.unacknowledgePost(postId, currentUser);
  }

  @Get('posts/:postId/acknowledgments')
  async getPostAcknowledgments(@Param('postId') postId: string) {
    return this.forumService.getPostAcknowledgments(postId);
  }

  // ==================== Reports ====================

  @Post('posts/:postId/report')
  async reportPost(
    @Param('postId') postId: string,
    @Body() body: { reason: string; note?: string },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.reportPost(postId, body.reason, body.note, currentUser);
  }

  @Get('reports')
  async getReports(
    @Query('status') status: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.getReports(currentUser, status);
  }

  @Patch('reports/:id')
  async reviewReport(
    @Param('id') id: string,
    @Body() body: { action: 'dismiss' | 'hide_post' | 'warn_user' | 'ban_user' },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.reviewReport(id, body.action, currentUser);
  }

  // ==================== Bookmarks ====================

  @Post('threads/:id/bookmark')
  async bookmarkThread(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.bookmarkThread(id, currentUser);
  }

  @Delete('threads/:id/bookmark')
  async unbookmarkThread(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.unbookmarkThread(id, currentUser);
  }

  @Get('threads/:id/bookmark')
  async getBookmarkStatus(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.getBookmarkStatus(id, currentUser);
  }

  @Get('bookmarks')
  async getBookmarkedThreads(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.getBookmarkedThreads(currentUser);
  }

  // ==================== Subscriptions ====================

  @Post('threads/:id/subscribe')
  async subscribeThread(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.subscribeThread(id, currentUser);
  }

  @Delete('threads/:id/subscribe')
  async unsubscribeThread(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.unsubscribeThread(id, currentUser);
  }

  // ==================== F9-701: Share Tracking ====================

  @Post('threads/:id/share')
  async trackShare(@Param('id') id: string) {
    return this.forumService.trackThreadShare(id);
  }

  // ==================== F9-702: Digest Email ====================

  @Post('admin/digest')
  async sendForumDigest(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.sendForumDigest(currentUser);
  }

  // ==================== F9-704: Related Products ====================

  @Public()
  @Get('threads/:id/related-products')
  async getRelatedProducts(@Param('id') id: string) {
    return this.forumService.getRelatedProducts(id);
  }

  // ==================== F9-705: Micro-Tip ====================

  @Post('posts/:postId/tip')
  async tipPost(
    @Param('postId') postId: string,
    @Body() body: { amount: number; currency?: string },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.tipPost(postId, body.amount, body.currency ?? 'NGN', currentUser);
  }

  @Get('threads/:id/subscribe')
  async getSubscriptionStatus(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.getSubscriptionStatus(id, currentUser);
  }

  // ==================== Moderation ====================

  @Patch('threads/:id/moderate/:action')
  async moderateThread(
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin',
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.moderateThread(id, action, currentUser);
  }

  // ==================== F9-604: Elder Flags ====================

  @Post('posts/:postId/elder-flag')
  async createElderFlag(
    @Param('postId') postId: string,
    @Body() body: { reason: string },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.createElderFlag(postId, body.reason, currentUser);
  }

  @Get('posts/:postId/elder-reactions')
  async getPostElderReactions(@Param('postId') postId: string) {
    return this.forumService.getPostElderReactions(postId);
  }

  @Post('posts/:postId/elder-reactions')
  async reactToPost(
    @Param('postId') postId: string,
    @Body() body: { emoji: string },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.reactToPost(postId, body.emoji, currentUser);
  }

  @Delete('posts/:postId/elder-reactions')
  async removeElderReaction(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.removeElderReaction(postId, currentUser);
  }

  @Get('me/contribution-streak')
  async getContributionStreak(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.getContributionStreak(currentUser);
  }

  @Get('elder-reactions/mine')
  async getMyElderReactions(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.getMyElderReactions(currentUser);
  }

  @Get('elder-flags')
  async getElderFlags(
    @Query('status') status: string,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.getElderFlags(currentUser, status);
  }

  @Patch('elder-flags/:id')
  async reviewElderFlag(
    @Param('id') id: string,
    @Body() body: { action: 'acknowledge' | 'remove_post' | 'request_edit' | 'dismiss' },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.reviewElderFlag(id, body.action, currentUser);
  }

  @Public()
  @Get('live-sessions')
  async listLiveSessions(@Query('status') status?: string) {
    return this.forumService.listLiveSessions(status);
  }

  @Post('live-sessions')
  async createLiveSession(
    @Body()
    body: {
      title: string;
      hostIds?: string[];
      scheduledAt: string;
      platform: string;
      externalUrl: string;
      preThreadId?: string;
    },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.createLiveSession(
      {
        title: body.title,
        hostIds: body.hostIds ?? [],
        scheduledAt: body.scheduledAt,
        platform: body.platform,
        externalUrl: body.externalUrl,
        preThreadId: body.preThreadId,
      },
      currentUser,
    );
  }

  @Patch('live-sessions/:id/status')
  async updateLiveSessionStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.forumService.updateLiveSessionStatus(id, body.status, currentUser);
  }
}
