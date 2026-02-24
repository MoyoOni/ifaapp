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
import { ForumService } from './forum.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('forum')
@UseGuards(AuthGuard('jwt'))
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // ==================== Categories ====================

  @Get('categories')
  async findAllCategories() {
    return this.forumService.findAllCategories();
  }

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

  @Get('threads')
  async findAllThreads(@Query('categoryId') categoryId?: string, @Query('status') status?: string) {
    return this.forumService.findAllThreads(categoryId, status);
  }

  @Get('threads/:id')
  async findThreadById(@Param('id') id: string) {
    return this.forumService.findThreadById(id);
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

  // ==================== Posts ====================

  @Get('threads/:threadId/posts')
  async findAllPosts(
    @Param('threadId') threadId: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.forumService.findAllPosts(threadId);
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

  // ==================== Moderation ====================

  @Patch('threads/:id/moderate/:action')
  async moderateThread(
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin',
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.forumService.moderateThread(id, action, currentUser);
  }
}
