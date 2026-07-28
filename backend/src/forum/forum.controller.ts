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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SetThreadSacredDto } from './dto/set-thread-sacred.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { TipPostDto } from './dto/tip-post.dto';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
  ReorderForumCategoryDto,
  MoveThreadToCategoryDto,
  FeatureThreadDto,
  MergeThreadsDto,
  DeleteThreadAdminDto,
} from './dto/forum-category-admin.dto';
import { CreateElderFlagDto, ReactToPostDto, ReviewElderFlagDto } from './dto/elder-actions.dto';
import { CreateLiveSessionDto, UpdateLiveSessionStatusDto } from './dto/live-session.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard, AdminRoles } from '../auth/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { AdminSubRole } from '@common/enums/admin-sub-role.enum';

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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getForumStats() {
    return this.forumService.getForumStats();
  }

  // F9-903: Detailed Forum Health Metrics
  @Get('admin/metrics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDetailedMetrics(@Query('period') period?: '7d' | '30d' | '90d') {
    return this.forumService.getDetailedMetrics(period || '7d');
  }

  @Public()
  @Get('search')
  async searchForum(@Query('q') q: string, @CurrentUser() currentUser?: CurrentUserPayload) {
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

  // COMMUNITY_BACKLOG.md FOR-Q3: "Ask an Elder"
  @Public()
  @Get('elders-answering')
  async findEldersAnswering() {
    return this.forumService.findEldersAnswering();
  }

  @Post('categories')
  async createCategory(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.createCategory(dto, currentUser);
  }

  // ==================== COMMUNITY_BACKLOG.md FOR-004: Learning Pathways ====================

  @Public()
  @Get('series')
  async getThreadSeries() {
    return this.forumService.getThreadSeries();
  }

  @Public()
  @Get('series/:seriesName')
  async getThreadsInSeries(
    @Param('seriesName') seriesName: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.forumService.getThreadsInSeries(seriesName, currentUser ?? null);
  }

  // ==================== Threads ====================

  @Public()
  @Get('threads')
  async findAllThreads(
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('tag') tag?: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.forumService.findAllThreads(categoryId, status, tag, currentUser ?? null);
  }

  @Public()
  @Get('threads/:id')
  async findThreadById(@Param('id') id: string, @CurrentUser() currentUser?: CurrentUserPayload) {
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async setThreadSacred(
    @Param('id') id: string,
    @Body() dto: SetThreadSacredDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.updateThread(id, { isSacred: dto.isSacred }, currentUser);
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
    @Body() dto: ReportPostDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.reportPost(postId, dto.reason, dto.note, currentUser);
  }

  @Get('reports')
  async getReports(
    @Query('status') status: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.getReports(currentUser, status);
  }

  @Patch('reports/:id')
  async reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.reviewReport(id, dto.action, currentUser);
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
    @Body() dto: TipPostDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.tipPost(postId, dto.amount, dto.currency ?? 'NGN', currentUser);
  }

  @Get('threads/:id/subscribe')
  async getSubscriptionStatus(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.getSubscriptionStatus(id, currentUser);
  }

  // ==================== Admin Forum Management ====================

  @Get('admin/categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllForumCategories() {
    return this.forumService.getAllForumCategories();
  }

  @Post('admin/categories')
  async createForumCategory(
    @Body() dto: CreateForumCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.createForumCategory(dto, currentUser);
  }

  @Patch('admin/categories/:id')
  async updateForumCategory(
    @Param('id') id: string,
    @Body() dto: UpdateForumCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.updateForumCategory(id, dto, currentUser);
  }

  @Delete('admin/categories/:id')
  async deleteForumCategory(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.deleteForumCategory(id, currentUser);
  }

  @Patch('admin/categories/:id/reorder')
  async reorderForumCategory(
    @Param('id') id: string,
    @Body() dto: ReorderForumCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.reorderForumCategory(id, dto.newPosition, currentUser);
  }

  @Patch('admin/threads/:id/move')
  async moveThreadToCategory(
    @Param('id') id: string,
    @Body() dto: MoveThreadToCategoryDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.moveThreadToCategory(id, dto.targetCategoryId, currentUser);
  }

  @Patch('admin/threads/:id/feature')
  async featureThread(
    @Param('id') id: string,
    @Body() dto: FeatureThreadDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.featureThread(id, dto.isFeatured, currentUser);
  }

  @Post('admin/threads/merge')
  async mergeThreads(@Body() dto: MergeThreadsDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.forumService.mergeThreads(dto.primaryThreadId, dto.secondaryThreadId, currentUser);
  }

  @Delete('admin/threads/:id')
  async deleteThreadForAdmin(
    @Param('id') id: string,
    @Body() dto: DeleteThreadAdminDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.deleteThreadForAdmin(id, currentUser, dto.reason);
  }

  @Get('admin/management-stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getForumManagementStats() {
    return this.forumService.getForumManagementStats();
  }

  // ==================== Moderation ====================

  @Patch('threads/:id/moderate/:action')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @AdminRoles(AdminSubRole.MODERATOR, AdminSubRole.SUPER)
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
    @Body() dto: CreateElderFlagDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.createElderFlag(postId, dto.reason, currentUser);
  }

  @Get('posts/:postId/elder-reactions')
  async getPostElderReactions(@Param('postId') postId: string) {
    return this.forumService.getPostElderReactions(postId);
  }

  @Post('posts/:postId/elder-reactions')
  async reactToPost(
    @Param('postId') postId: string,
    @Body() dto: ReactToPostDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.reactToPost(postId, dto.emoji, currentUser);
  }

  @Delete('posts/:postId/elder-reactions')
  async removeElderReaction(
    @Param('postId') postId: string,
    @CurrentUser() currentUser: CurrentUserPayload
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
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.getElderFlags(currentUser, status);
  }

  @Patch('elder-flags/:id')
  async reviewElderFlag(
    @Param('id') id: string,
    @Body() dto: ReviewElderFlagDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.reviewElderFlag(id, dto.action, currentUser);
  }

  @Public()
  @Get('live-sessions')
  async listLiveSessions(@Query('status') status?: string) {
    return this.forumService.listLiveSessions(status);
  }

  // ==================== D3: Crisis Signal Admin ====================

  @Get('admin/crisis-signals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getCrisisSignalPosts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.forumService.getCrisisSignalPosts(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Patch('admin/crisis-signals/:postId/clear')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async clearCrisisSignal(
    @Param('postId') postId: string,
    @Query('source') source: 'forum' | 'circle' | undefined,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.clearCrisisSignal(postId, source || 'forum', currentUser);
  }

  @Post('live-sessions')
  async createLiveSession(
    @Body() dto: CreateLiveSessionDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.createLiveSession({ ...dto, hostIds: dto.hostIds ?? [] }, currentUser);
  }

  @Patch('live-sessions/:id/status')
  async updateLiveSessionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLiveSessionStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.updateLiveSessionStatus(id, dto.status, currentUser);
  }
}
