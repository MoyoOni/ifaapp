import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { Appointment, User } from '@prisma/client';
import { EscrowType, EscrowStatus } from '@ile-ase/common';
import { AvailabilitySlot } from './types';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private walletService: WalletService
  ) {}

  private async getAppointmentWithDetails(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        babalawo: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
        client: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  private timesOverlap(
    existing: Appointment,
    newDate: string,
    newTime: string,
    newDuration: number
  ): boolean {
    const existingStart = new Date(`${existing.date}T${existing.time}`);
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);

    const newStart = new Date(`${newDate}T${newTime}`);
    const newEnd = new Date(newStart.getTime() + newDuration * 60000);

    return newStart < existingEnd && newEnd > existingStart;
  }

  async isTimeSlotAvailable(
    babalawoId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    const babalawo = await this.prisma.user.findUnique({
      where: { id: babalawoId },
      include: {
        appointmentsAsBabalawo: {
          where: {
            date,
            status: { notIn: ['CANCELLED', 'DECLINED'] },
          },
        },
      },
    });

    if (!babalawo) throw new BadRequestException('Babalawo not found.');

    const conflicts = babalawo.appointmentsAsBabalawo.some((appt) =>
      this.timesOverlap(appt, date, time, duration)
    );

    return !conflicts;
  }

  async createBooking(
    dto: CreateAppointmentDto,
    currentUser: CurrentUserPayload
  ): Promise<Appointment> {
    const { babalawoId, clientId, date, time, duration = 60, price = 0 } = dto;

    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only book appointments for yourself.');
    }

    const appointmentStart = new Date(`${date}T${time}`);
    if (appointmentStart <= new Date()) {
      throw new BadRequestException('Appointment date and time must be in the future.');
    }

    const babalawo = await this.prisma.user.findFirst({
      where: { id: babalawoId, role: 'BABALAWO' },
    });
    if (!babalawo) {
      throw new BadRequestException('Invalid Babalawo ID.');
    }

    const isAvailable = await this.isTimeSlotAvailable(babalawoId, date, time, duration);
    if (!isAvailable) {
      throw new ConflictException('This time slot is already booked. Please choose another time.');
    }

    if (price > 0) {
      const wallet = await this.walletService.getWalletBalance(clientId);
      if (wallet.balance < price) {
        throw new BadRequestException('Insufficient funds.');
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        ...dto,
        status: 'PENDING_CONFIRMATION',
      },
      include: {
        babalawo: true,
        client: true,
      },
    });

    // Create escrow to hold payment until consultation is completed
    if (price > 0) {
      await this.walletService.createEscrow(
        clientId,
        {
          recipientId: babalawoId,
          amount: price,
          type: EscrowType.BOOKING,
          relatedId: appointment.id,
          notes: `Consultation booking with ${babalawo.name} on ${date} at ${dto.time}`,
        },
        currentUser
      );
    }

    // Notify babalawo of new booking
    await this.notificationService.notifyAppointmentCreated(appointment.id, babalawoId, {
      clientName: appointment.client.name,
      date: appointment.date,
      time: appointment.time,
    });
    // Notify client that their booking was scheduled (PB-206.2)
    await this.notificationService.notifyAppointmentCreated(appointment.id, appointment.clientId, {
      babalawoName: appointment.babalawo.name,
      date: appointment.date,
      time: appointment.time,
    });

    return appointment;
  }

  async updateStatus(
    id: string,
    status: 'CONFIRMED' | 'CANCELLED' | 'DECLINED' | 'COMPLETED',
    currentUser: CurrentUserPayload,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentWithDetails(id);

    const isClient = currentUser.id === appointment.clientId;
    const isBabalawo = currentUser.id === appointment.babalawoId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isClient && !isBabalawo && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update this appointment.');
    }

    if (status === 'CONFIRMED' || status === 'DECLINED') {
      if (!isBabalawo && !isAdmin)
        throw new ForbiddenException('Only a Babalawo can confirm or decline.');
    }

    // Handle escrow based on status change
    if (status === 'CANCELLED' || status === 'DECLINED') {
      // Refund escrow to client
      if ((appointment.price ?? 0) > 0) {
        const escrow = await this.prisma.escrow.findFirst({
          where: {
            relatedId: appointment.id,
            type: EscrowType.BOOKING,
            status: EscrowStatus.HOLD,
          },
        });

        if (escrow) {
          await this.walletService.cancelEscrow(appointment.clientId, escrow.id, currentUser);
        }
      }
    }

    if (status === 'COMPLETED') {
      // Release escrow to babalawo
      if ((appointment.price ?? 0) > 0) {
        const escrow = await this.prisma.escrow.findFirst({
          where: {
            relatedId: appointment.id,
            type: EscrowType.BOOKING,
            status: EscrowStatus.HOLD,
          },
        });

        if (escrow) {
          await this.walletService.releaseEscrow(
            appointment.clientId,
            { escrowId: escrow.id },
            currentUser
          );
        }
      }
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        notes: reason
          ? `${appointment.notes || ''}\n${status} reason: ${reason}`
          : appointment.notes,
        ...(status === 'CANCELLED' && { cancelledAt: new Date(), cancelledBy: currentUser.id }),
      },
    });

    // Send notifications based on status change
    if (status === 'CONFIRMED') {
      await this.notificationService.notifyAppointmentConfirmed(
        appointment.id,
        appointment.clientId,
        {
          babalawoName: appointment.babalawo.name,
          date: appointment.date,
          time: appointment.time,
        }
      );
    } else if (status === 'DECLINED') {
      const baseDecline = {
        reason: reason || 'Appointment declined',
        date: appointment.date,
        time: appointment.time,
      };
      // Notify both parties about the decline (PB-206.2)
      await this.notificationService.notifyAppointmentDeclined(
        appointment.id,
        appointment.clientId,
        {
          ...baseDecline,
          declinedBy: currentUser.id === appointment.clientId ? 'You' : appointment.babalawo.name,
        }
      );
      await this.notificationService.notifyAppointmentDeclined(
        appointment.id,
        appointment.babalawoId,
        {
          ...baseDecline,
          declinedBy: currentUser.id === appointment.babalawoId ? 'You' : appointment.client.name,
        }
      );
    } else if (status === 'CANCELLED') {
      const baseCancel = {
        reason: reason || `Appointment ${status.toLowerCase()}`,
        date: appointment.date,
        time: appointment.time,
      };
      // Notify both parties (PB-206.2)
      await this.notificationService.notifyAppointmentCancelled(
        appointment.id,
        appointment.clientId,
        {
          ...baseCancel,
          cancelledBy: currentUser.id === appointment.clientId ? 'You' : appointment.babalawo.name,
        }
      );
      await this.notificationService.notifyAppointmentCancelled(
        appointment.id,
        appointment.babalawoId,
        {
          ...baseCancel,
          cancelledBy: currentUser.id === appointment.babalawoId ? 'You' : appointment.client.name,
        }
      );
    }

    return updatedAppointment;
  }

  async findByBabalawo(babalawoId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== babalawoId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own appointments');
    }

    return this.prisma.appointment.findMany({
      where: { babalawoId },
      include: {
        client: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
      },
      orderBy: { date: 'asc', time: 'asc' },
    });
  }

  async findByClient(clientId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own appointments');
    }
    return this.prisma.appointment.findMany({
      where: { clientId },
      include: {
        babalawo: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
      },
      orderBy: { date: 'asc', time: 'asc' },
    });
  }

  async getAvailableTimeSlots(babalawoId: string, date: string) {
    const babalawo = await this.prisma.user.findUnique({
      where: { id: babalawoId },
      select: {
        id: true,
        availability: true,
      },
    });

    if (!babalawo) {
      throw new BadRequestException('Invalid babalawo ID');
    }

    const availability = babalawo.availability as unknown as AvailabilitySlot[];

    if (!availability) {
      return [];
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    const dailyAvailability = Array.isArray(availability)
      ? (availability as AvailabilitySlot[]).find(
          (avail: AvailabilitySlot) => avail.day === dayOfWeek
        )
      : undefined;

    if (!dailyAvailability || !dailyAvailability.slots || dailyAvailability.slots.length === 0) {
      return [];
    }

    const availableSlots: string[] = [];

    for (const timeRange of dailyAvailability.slots) {
      const [start, end] = timeRange.split('-');
      if (!start || !end) continue;

      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      while (currentMinutes + 60 <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;

        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        const isAvailable = await this.isTimeSlotAvailable(babalawoId, date, formattedTime, 60);

        if (isAvailable) {
          const hour12 = hour % 12 || 12;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayTime = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
          availableSlots.push(displayTime);
        }

        currentMinutes += 60;
      }
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (date === today) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentMinutes = currentHour * 60 + currentMinute;

      return availableSlots.filter((slot) => {
        const [timePart, period] = slot.split(' ');
        let [hour, minute] = timePart.split(':').map(Number);

        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }

        const slotMinutes = hour * 60 + minute;
        return slotMinutes > currentMinutes;
      });
    }

    return availableSlots;
  }

  async update(id: string, dto: UpdateAppointmentDto, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isClient = currentUser.id === appointment.clientId;
    const isBabalawo = currentUser.id === appointment.babalawoId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isClient && !isBabalawo && !isAdmin) {
      throw new ForbiddenException('You can only update your own appointments');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const isClient = currentUser.id === appointment.clientId;
    const isBabalawo = currentUser.id === appointment.babalawoId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isClient && !isBabalawo && !isAdmin) {
      throw new ForbiddenException('You are not authorized to view this appointment');
    }

    return appointment;
  }

  async checkAvailability(
    dto: CheckAvailabilityDto
  ): Promise<{ available: boolean; message: string }> {
    const { babalawoId, date, time, duration = '60' } = dto;

    const durationNum = parseInt(duration, 10);

    // Validate babalawo exists
    const babalawo = await this.prisma.user.findFirst({
      where: { id: babalawoId, role: 'BABALAWO' },
    });

    if (!babalawo) {
      return {
        available: false,
        message: 'Invalid Babalawo ID',
      };
    }

    // Check if date/time is in the future
    const appointmentDateTime = new Date(`${date}T${time}`);
    if (appointmentDateTime <= new Date()) {
      return {
        available: false,
        message: 'Appointment time must be in the future',
      };
    }

    // Check time slot availability
    const isAvailable = await this.isTimeSlotAvailable(babalawoId, date, time, durationNum);

    if (!isAvailable) {
      return {
        available: false,
        message: 'This time slot is already booked',
      };
    }

    // Check babalawo's availability settings
    const availability = babalawo.availability as unknown as AvailabilitySlot[];
    if (availability) {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

      const dailyAvailability = Array.isArray(availability)
        ? availability.find((avail: AvailabilitySlot) => avail.day === dayOfWeek)
        : undefined;

      if (!dailyAvailability) {
        return {
          available: false,
          message: `Babalawo is not available on ${dayOfWeek}s`,
        };
      }

      // Check if time falls within available slots
      const timeIsValid =
        dailyAvailability.slots?.some((slot: string) => {
          const [start, end] = slot.split('-');
          if (!start || !end) return false;

          const [startHour, startMinute] = start.split(':').map(Number);
          const [endHour, endMinute] = end.split(':').map(Number);
          const [reqHour, reqMinute] = time.split(':').map(Number);

          const startTimeMinutes = startHour * 60 + startMinute;
          const endTimeMinutes = endHour * 60 + endMinute;
          const reqTimeMinutes = reqHour * 60 + reqMinute;

          return (
            reqTimeMinutes >= startTimeMinutes && reqTimeMinutes + durationNum <= endTimeMinutes
          );
        }) ?? false;

      if (!timeIsValid) {
        return {
          available: false,
          message: "Selected time is outside Babalawo's available hours",
        };
      }
    }

    return {
      available: true,
      message: 'Time slot is available for booking',
    };
  }

  async getClientUpcomingAppointments(clientId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own appointments');
    }

    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        clientId,
        date: {
          gte: now.toISOString().split('T')[0],
        },
        status: {
          in: ['PENDING_CONFIRMATION', 'CONFIRMED'],
        },
      },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async getBabalawoUpcomingAppointments(babalawoId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== babalawoId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own appointments');
    }

    const now = new Date();
    return this.prisma.appointment.findMany({
      where: {
        babalawoId,
        date: {
          gte: now.toISOString().split('T')[0],
        },
        status: {
          in: ['PENDING_CONFIRMATION', 'CONFIRMED'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }
}
