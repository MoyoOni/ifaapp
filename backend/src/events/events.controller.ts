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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

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
  @Get(':identifier')
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
   */
  @Get('user/:userId/registrations')
  async getUserRegistrations(@Param('userId') userId: string) {
    return this.eventsService.getUserRegistrations(userId);
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
  @Get(':id/attendees')
  async getEventAttendees(
    @Param('id') eventId: string,
    @CurrentUser() currentUser?: CurrentUserPayload
  ) {
    return this.eventsService.getEventAttendees(eventId, currentUser);
  }
}
