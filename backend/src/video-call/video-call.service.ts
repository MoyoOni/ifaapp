import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Video Call Service
 * Handles Agora.io video room creation, token generation, and recording management
 */
@Injectable()
export class VideoCallService {
  private readonly logger = new Logger(VideoCallService.name);
  private readonly appId: string;
  private readonly appCertificate: string;
  private readonly tokenExpirationTime: number = 3600; // 1 hour in seconds

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.appId = this.configService.get<string>('AGORA_APP_ID') || '';
    this.appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE') || '';

    if (!this.appId || !this.appCertificate) {
      this.logger.warn('Agora.io credentials not configured. Video calls will not work.');
    }
  }

  /**
   * Generate Agora.io access token for a user to join a video room
   * @param appointmentId Appointment ID
   * @param userId User ID requesting the token
   * @param currentUser Current authenticated user
   * @returns Token and room information
   */
  async generateToken(appointmentId: string, userId: string, currentUser: CurrentUserPayload) {
    // Verify user is authorized
    if (currentUser.id !== userId) {
      throw new BadRequestException('You can only generate tokens for yourself');
    }

    // Fetch appointment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        babalawo: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is part of this appointment
    if (appointment.babalawoId !== userId && appointment.clientId !== userId) {
      throw new BadRequestException('You are not authorized to join this appointment');
    }

    // Check appointment status
    if (appointment.status === 'CANCELLED') {
      throw new BadRequestException('This appointment has been cancelled');
    }

    if (appointment.status === 'COMPLETED') {
      throw new BadRequestException('This appointment has already been completed');
    }

    // Generate or reuse room ID
    let roomId = appointment.videoRoomId;
    if (!roomId) {
      roomId = `appointment_${appointmentId}`;
      // Update appointment with room ID
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { videoRoomId: roomId },
      });
    }

    // Generate token
    const token = this.generateAgoraToken(roomId, userId);

    // Update appointment status if needed
    if (appointment.status === 'UPCOMING') {
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'IN_SESSION' },
      });
    }

    return {
      token,
      roomId,
      appId: this.appId,
      appointmentId: appointment.id,
      expiresIn: this.tokenExpirationTime,
    };
  }

  /**
   * Generate Agora.io RTC token
   * @param channelName Channel/room name
   * @param uid User ID (0 for auto-generated)
   * @returns Access token
   */
  private generateAgoraToken(channelName: string, uid: string): string {
    if (!this.appId || !this.appCertificate) {
      throw new BadRequestException(
        'Video call service is not configured. Please contact support.'
      );
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + this.tokenExpirationTime;

    // Generate token with publisher role (can publish and subscribe)
    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      parseInt(uid, 10) || 0, // Use 0 for auto-generated UID
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs // privilegeExpire - same as token expiration
    );

    return token;
  }

  /**
   * End video session and update appointment status
   * @param appointmentId Appointment ID
   * @param currentUser Current authenticated user
   */
  async endSession(appointmentId: string, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is part of this appointment
    if (appointment.babalawoId !== currentUser.id && appointment.clientId !== currentUser.id) {
      throw new BadRequestException('You are not authorized to end this session');
    }

    // Update appointment status
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        videoToken: null, // Clear token for security
      },
    });

    return { success: true, message: 'Session ended successfully' };
  }

  /**
   * Store recording URL after session ends
   * @param appointmentId Appointment ID
   * @param recordingUrl URL to the recorded session
   * @param currentUser Current authenticated user (must be admin or appointment participant)
   */
  async storeRecording(
    appointmentId: string,
    recordingUrl: string,
    currentUser: CurrentUserPayload
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is admin or part of this appointment
    const isParticipant =
      appointment.babalawoId === currentUser.id || appointment.clientId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new BadRequestException(
        'You are not authorized to store recordings for this appointment'
      );
    }

    // Update appointment with recording URL
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { recordingUrl },
    });

    return { success: true, recordingUrl };
  }

  /**
   * Get video call information for an appointment
   * @param appointmentId Appointment ID
   * @param currentUser Current authenticated user
   */
  async getVideoCallInfo(appointmentId: string, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        babalawo: { select: { id: true, name: true, yorubaName: true, avatar: true } },
        client: { select: { id: true, name: true, yorubaName: true, avatar: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Verify user is part of this appointment
    if (appointment.babalawoId !== currentUser.id && appointment.clientId !== currentUser.id) {
      throw new BadRequestException('You are not authorized to view this appointment');
    }

    return {
      appointmentId: appointment.id,
      roomId: appointment.videoRoomId,
      status: appointment.status,
      recordingUrl: appointment.recordingUrl,
      babalawo: appointment.babalawo,
      client: appointment.client,
      canJoin: appointment.status === 'UPCOMING' || appointment.status === 'IN_SESSION',
    };
  }
}
