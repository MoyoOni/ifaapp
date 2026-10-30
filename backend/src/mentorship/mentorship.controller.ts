import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { MentorshipService } from './mentorship.service';
import { CreateMentorshipBookingDto, SetMeetingDto } from './dto/mentorship.dto';

// SHOP_BACKLOG.md MSP-023: paid mentorship sessions. Every rule (Devoted
// client, verified babalawo, who may act on a booking) lives in the service.
@Controller('mentorship')
@UseGuards(AuthGuard('jwt'))
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @Get('offerings')
  listOfferings() {
    return this.mentorshipService.listOfferings();
  }

  @Post('bookings')
  createBooking(@Body() dto: CreateMentorshipBookingDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.createBooking(dto, user);
  }

  @Get('bookings')
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.listMine(user);
  }

  @Patch('bookings/:id/meeting')
  setMeeting(@Param('id') id: string, @Body() dto: SetMeetingDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.setMeeting(id, dto, user);
  }

  @Post('bookings/:id/sessions/held')
  markSessionHeld(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.markSessionHeld(id, user);
  }

  @Post('bookings/:id/sessions/confirm')
  confirmSession(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.confirmSession(id, user);
  }

  @Post('bookings/:id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.mentorshipService.cancel(id, user);
  }
}
