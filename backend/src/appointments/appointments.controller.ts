import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Create a new appointment booking
   * POST /appointments
   */
  @Post()
  async createBooking(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.createBooking(dto, currentUser);
  }

  /**
   * Get available time slots for a babalawo on a specific date
   * GET /appointments/babalawo/:babalawoId/available-slots?date=YYYY-MM-DD
   */
  @Get('babalawo/:babalawoId/available-slots')
  async getAvailableTimeSlots(
    @Param('babalawoId') babalawoId: string,
    @Query('date') date: string
  ) {
    if (!date) {
      throw new BadRequestException('Date parameter is required');
    }
    return this.appointmentsService.getAvailableTimeSlots(babalawoId, date);
  }

  /**
   * Get all appointments for a babalawo
   * GET /appointments/babalawo/:babalawoId
   */
  @Get('babalawo/:babalawoId')
  async findByBabalawo(
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.findByBabalawo(babalawoId, currentUser);
  }

  /**
   * Get all appointments for a client
   * GET /appointments/client/:clientId
   */
  @Get('client/:clientId')
  async findByClient(
    @Param('clientId') clientId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.findByClient(clientId, currentUser);
  }

  /**
   * Babalawo confirms an appointment booking
   * PATCH /appointments/:id/confirm
   */
  @Patch(':id/confirm')
  async confirm(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.appointmentsService.updateStatus(id, 'CONFIRMED', currentUser);
  }

  /**
   * Babalawo declines an appointment booking
   * PATCH /appointments/:id/decline
   */
  @Patch(':id/decline')
  async decline(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.updateStatus(id, 'DECLINED', currentUser, reason);
  }

  /**
   * Cancel an appointment (either party)
   * PATCH /appointments/:id/cancel
   */
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.updateStatus(id, 'CANCELLED', currentUser, reason);
  }

  /**
   * Mark appointment as completed (babalawo or admin)
   * PATCH /appointments/:id/complete
   */
  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.updateStatus(id, 'COMPLETED', currentUser, notes);
  }

  /**
   * Generic update for other appointment fields
   * PATCH /appointments/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.update(id, dto, currentUser);
  }

  /**
   * Get specific appointment details
   * GET /appointments/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserPayload) {
    return this.appointmentsService.findOne(id, currentUser);
  }

  /**
   * Check if a specific time slot is available for booking
   * POST /appointments/check-availability
   */
  @Post('check-availability')
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.appointmentsService.checkAvailability(dto);
  }

  /**
   * Get upcoming appointments for a client
   * GET /appointments/client/:clientId/upcoming
   */
  @Get('client/:clientId/upcoming')
  async getClientUpcoming(
    @Param('clientId') clientId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.getClientUpcomingAppointments(clientId, currentUser);
  }

  /**
   * Get upcoming appointments for a babalawo
   * GET /appointments/babalawo/:babalawoId/upcoming
   */
  @Get('babalawo/:babalawoId/upcoming')
  async getBabalawoUpcoming(
    @Param('babalawoId') babalawoId: string,
    @CurrentUser() currentUser: CurrentUserPayload
  ) {
    return this.appointmentsService.getBabalawoUpcomingAppointments(babalawoId, currentUser);
  }
}
