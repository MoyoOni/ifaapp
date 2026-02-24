import { Controller, Get, Post, Patch, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('messaging')
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send/:senderId')
  async sendMessage(
    @Param('senderId') senderId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.messagingService.sendMessage(senderId, dto, currentUser);
  }

  @Get('conversation/:userId/:otherUserId')
  async getConversation(
    @Param('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.messagingService.getConversation(userId, otherUserId, currentUser);
  }

  @Get('inbox/:userId')
  async getInbox(@Param('userId') userId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.messagingService.getInbox(userId, currentUser);
  }

  @Patch('messages/:messageId/read/:userId')
  async markAsRead(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.messagingService.markAsRead(messageId, userId, currentUser);
  }

  @Patch('conversation/:otherUserId/:userId/read')
  async markConversationAsRead(
    @Param('otherUserId') otherUserId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.messagingService.markConversationAsRead(otherUserId, userId, currentUser);
  }

  @Delete('messages/:messageId/:userId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.messagingService.deleteMessage(messageId, userId, currentUser);
  }
}
