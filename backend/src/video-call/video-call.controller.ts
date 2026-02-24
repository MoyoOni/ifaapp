import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideoCallService } from './video-call.service';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('video-call')
@UseGuards(AuthGuard('jwt'))
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  /**
   * Generate video call token for an appointment
   * POST /video-call/appointment/:appointmentId/token/:userId
   */
  @Post('appointment/:appointmentId/token/:userId')
  async generateToken(
    @Param('appointmentId') appointmentId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.videoCallService.generateToken(appointmentId, userId, currentUser);
  }

  /**
   * Get video call information for an appointment
   * GET /video-call/appointment/:appointmentId
   */
  @Get('appointment/:appointmentId')
  async getVideoCallInfo(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.videoCallService.getVideoCallInfo(appointmentId, currentUser);
  }

  /**
   * End video session
   * PATCH /video-call/appointment/:appointmentId/end
   */
  @Patch('appointment/:appointmentId/end')
  async endSession(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.videoCallService.endSession(appointmentId, currentUser);
  }

  /**
   * Store recording URL
   * PATCH /video-call/appointment/:appointmentId/recording
   */
  @Patch('appointment/:appointmentId/recording')
  async storeRecording(
    @Param('appointmentId') appointmentId: string,
    @Body('recordingUrl') recordingUrl: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.videoCallService.storeRecording(appointmentId, recordingUrl, currentUser);
  }
}
