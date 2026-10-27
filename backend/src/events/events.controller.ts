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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../shared/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Create a new event
   * POST /events
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateEventDto, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.eventsService.create(dto, currentUser);
  }

  /**
   * Get all events (with optional filters)
   * GET /events?search=...&type=...&status=...&published=...&upcoming=...
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('published') published?: string,
    @Query('templeId') templeId?: string,
    @Query('circleId') circleId?: string,
    @Query('upcoming') upcoming?: string
  ) {
    return this.eventsService.findAll({
      search,
      type,
      status,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      templeId,
      circleId,
      upcoming: upcoming === 'true',
    });
  }

  /**
   * Get event by ID or slug
   * GET /events/:identifier
   */
  // Public, but optionally authenticated: with no guard at all (as this used
  // to be) currentUser was always undefined, so the response never included
  // the member's own registration -- which the frontend then papered over by
  // fabricating one whenever registering failed.
  @Get(':identifier')
  @UseGuards(JwtAuthGuard)
  @Public()
  async findOne(
    @Param('identifier') identifier: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.eventsService.findOne(identifier, currentUser);
  }

  /**
   * Update event
   * PATCH /events/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.eventsService.update(eventId, dto, currentUser);
  }

  /**
   * Delete event
   * DELETE /events/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') eventId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.eventsService.delete(eventId, currentUser);
  }

  /**
   * Register for an event
   * POST /events/:id/register
   */
  @Post(':id/register')
  @UseGuards(AuthGuard('jwt'))
  async registerForEvent(
    @Param('id') eventId: string,
    @Body('notes') notes: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.eventsService.registerForEvent(eventId, currentUser, notes);
  }

  /**
   * Cancel event registration
   * POST /events/:id/cancel-registration
   */
  @Post(':id/cancel-registration')
  @UseGuards(AuthGuard('jwt'))
  async cancelRegistration(
    @Param('id') eventId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.eventsService.cancelRegistration(eventId, currentUser);
  }

  /**
   * Get user's event registrations
   * GET /events/user/:userId/registrations
   * Only the user themselves or an admin can view this -- was previously
   * unauthenticated with no ownership check at all (IDOR).
   */
  @Get('user/:userId/registrations')
  @UseGuards(AuthGuard('jwt'))
  async getUserRegistrations(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own event registrations');
    }
    return this.eventsService.getUserRegistrations(userId);
  }

  /**
   * Record whether a registered member attended (organizer or admin only)
   * PATCH /events/:id/attendees/:userId/attendance
   */
  @Patch(':id/attendees/:userId/attendance')
  @UseGuards(AuthGuard('jwt'))
  async markAttendance(
    @Param('id') eventId: string,
    @Param('userId') userId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.eventsService.markAttendance(eventId, userId, dto.attended, currentUser);
  }

  /**
   * Publish event
   * PATCH /events/:id/publish
   */
  @Patch(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  async publishEvent(@Param('id') eventId: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.eventsService.publishEvent(eventId, currentUser);
  }

  /**
   * Get event attendees
   * GET /events/:id/attendees
   */
  // Same as findOne: without a guard the creator of an unpublished event
  // was always treated as anonymous and refused their own attendee list.
  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard)
  @Public()
  async getEventAttendees(
    @Param('id') eventId: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.eventsService.getEventAttendees(eventId, currentUser);
  }
}
