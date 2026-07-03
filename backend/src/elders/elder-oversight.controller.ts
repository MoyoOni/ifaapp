import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ElderOversightService } from './elder-oversight.service';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('elders')
@UseGuards(JwtAuthGuard)
export class ElderOversightController {
  private readonly logger = new Logger(ElderOversightController.name);

  constructor(private readonly elderOversightService: ElderOversightService) {}

  /**
   * Moderate a forum thread
   */
  @Put('moderate/thread/:threadId/:action')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only verified elders can moderate
  @HttpCode(HttpStatus.OK)
  async moderateForumThread(
    @CurrentUser() user: User,
    @Param('threadId') threadId: string,
    @Param('action') action: string,
    @Body('reason') reason?: string
  ) {
    this.logger.log(`Elder ${user.id} attempting to ${action} thread ${threadId}`);
    
    // Validate the action
    const validActions = ['lock', 'unlock', 'pin', 'unpin', 'approve', 'reject', 'delete'];
    if (!validActions.includes(action)) {
      return { error: `Invalid action. Valid actions: ${validActions.join(', ')}` };
    }
    
    return this.elderOversightService.moderateForumThread(
      user.id,
      threadId,
      action as any,
      reason
    );
  }

  /**
   * Moderate a forum post
   */
  @Put('moderate/post/:postId/:action')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only verified elders can moderate
  @HttpCode(HttpStatus.OK)
  async moderateForumPost(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
    @Param('action') action: string,
    @Body('reason') reason?: string
  ) {
    this.logger.log(`Elder ${user.id} attempting to ${action} post ${postId}`);
    
    // Validate the action
    const validActions = ['remove', 'approve', 'reject'];
    if (!validActions.includes(action)) {
      return { error: `Invalid action. Valid actions: ${validActions.join(', ')}` };
    }
    
    return this.elderOversightService.moderateForumPost(
      user.id,
      postId,
      action as any,
      reason
    );
  }

  /**
   * Endorse content
   */
  @Post('endorse/:contentType/:contentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only verified elders can endorse
  @HttpCode(HttpStatus.OK)
  async endorseContent(
    @CurrentUser() user: User,
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: string,
    @Body('endorsementType') endorsementType: string
  ) {
    this.logger.log(`Elder ${user.id} attempting to endorse ${contentType} ${contentId}`);
    
    // Validate content type
    const validContentTypes = ['thread', 'post', 'circle', 'temple'];
    if (!validContentTypes.includes(contentType)) {
      return { error: `Invalid content type. Valid types: ${validContentTypes.join(', ')}` };
    }
    
    // Validate endorsement type
    const validEndorsementTypes = ['blessing', 'verification', 'recommendation'];
    if (!validEndorsementTypes.includes(endorsementType)) {
      return { error: `Invalid endorsement type. Valid types: ${validEndorsementTypes.join(', ')}` };
    }
    
    return this.elderOversightService.endorseContent(
      user.id,
      contentId,
      contentType as any,
      endorsementType as any
    );
  }

  /**
   * Get moderation history for the current elder
   */
  @Get('moderation-history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only verified elders can view their history
  @HttpCode(HttpStatus.OK)
  async getModerationHistory(@CurrentUser() user: User) {
    this.logger.log(`Elder ${user.id} requesting moderation history`);
    return this.elderOversightService.getModerationHistory(user.id);
  }

  /**
   * Get items that need elder oversight
   */
  @Get('items-needing-oversight')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only verified elders can view items needing oversight
  @HttpCode(HttpStatus.OK)
  async getItemsNeedingOversight(@CurrentUser() user: User) {
    this.logger.log(`Elder ${user.id} requesting items needing oversight`);
    return this.elderOversightService.getItemsNeedingOversight(user.id);
  }

  /**
   * Check if user is a verified elder
   */
  @Get('verify-elder-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BABALAWO) // Only babalawos can check their own status
  @HttpCode(HttpStatus.OK)
  async verifyElderStatus(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} checking elder status`);
    const isElder = await this.elderOversightService.isVerifiedElder(user.id);
    return { userId: user.id, isVerifiedElder: isElder, role: user.role };
  }
}