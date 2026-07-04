import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';
import { Appointment } from '../shared/types/prisma-models';
import { EscrowType, EscrowStatus } from '@ile-ase/common';
import { AvailabilitySlot } from './types';
import { WhatsAppService } from '../whatsapp';
import { combineDateTimeInZone } from '../utils/scheduling.util';
import PDFDocument from 'pdfkit';

const DEFAULT_TIMEZONE = 'Africa/Lagos';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private walletService: WalletService,
    private whatsapp: WhatsAppService
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
    newTimezone: string,
    newDuration: number
  ): boolean {
    // P2-03: prefer the precomputed UTC instant; only pre-migration rows that
    // couldn't be backfilled (see migration 20260704000001) fall back to a
    // fresh timezone-aware combination of the legacy string fields.
    const existingStart =
      (existing as any).scheduledAt ??
      combineDateTimeInZone(
        existing.date,
        existing.time,
        (existing as any).timezone || DEFAULT_TIMEZONE
      );
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);

    const newStart = combineDateTimeInZone(newDate, newTime, newTimezone);
    const newEnd = new Date(newStart.getTime() + newDuration * 60000);

    return newStart < existingEnd && newEnd > existingStart;
  }

  async isTimeSlotAvailable(
    babalawoId: string,
    date: string,
    time: string,
    duration: number,
    client: Pick<PrismaService, 'user'> = this.prisma,
    timezone: string = DEFAULT_TIMEZONE
  ): Promise<boolean> {
    const babalawo = await client.user.findUnique({
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

    const conflicts = (babalawo as any).appointmentsAsBabalawo.some((appt: any) =>
      this.timesOverlap(appt, date, time, timezone, duration)
    );

    return !conflicts;
  }

  /**
   * Deterministic 32-bit hash of a booking scope (babalawoId + date), used as
   * the key for `pg_advisory_xact_lock` in createBooking (EMG-06). Postgres
   * advisory locks take an integer key, not an arbitrary string.
   */
  private lockKeyFor(babalawoId: string, date: string): number {
    const input = `${babalawoId}:${date}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) | 0; // keep it a 32-bit signed int
    }
    return hash;
  }

  async createBooking(
    dto: CreateAppointmentDto,
    currentUser: CurrentUserPayload
  ): Promise<Appointment> {
    const { babalawoId, clientId, date, time, duration = 60, price = 0 } = dto;
    const timezone = dto.timezone || DEFAULT_TIMEZONE;

    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only book appointments for yourself.');
    }

    // P2-03: combine in the appointment's own timezone rather than the
    // server's local time — a naive `new Date(...)` here silently assumed
    // the server ran in the same zone as the appointment.
    const scheduledAt = combineDateTimeInZone(date, time, timezone);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Appointment date and time must be in the future.');
    }

    const babalawo = await this.prisma.user.findFirst({
      where: { id: babalawoId, role: 'BABALAWO' },
    });
    if (!babalawo) {
      throw new BadRequestException('Invalid Babalawo ID.');
    }

    if (price > 0) {
      // currentUser is already verified above to be clientId (or ADMIN acting
      // on their behalf), so this satisfies WalletService's ownership check.
      const wallet = await this.walletService.getWalletBalance(clientId, currentUser);
      if (wallet.balance < price) {
        throw new BadRequestException('Insufficient funds.');
      }
    }

    // Check if client is Devoted — priority booking
    const clientUser = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { subscriptionStatus: true },
    });
    const isPriority = clientUser?.subscriptionStatus === 'DEVOTED';

    // EMG-06: the availability check and the appointment creation used to be
    // two separate, unsynchronized calls — two concurrent booking requests
    // for the same (or overlapping) slot could both pass the check before
    // either had committed, double-booking the babalawo. A Postgres advisory
    // lock scoped to this transaction serializes every booking attempt for
    // the same babalawo+date, so the second concurrent request re-checks
    // availability only after the first has actually committed its booking.
    // (A plain `@@unique([babalawoId, date, time])` constraint was considered
    // but rejected: it would only catch an exact time match — not the general
    // overlapping-duration case `timesOverlap` already checks for — and would
    // incorrectly block rebooking an exact slot after a prior CANCELLED/
    // DECLINED appointment there, since a bare unique index has no WHERE
    // clause to exclude those statuses.)
    const appointment = await this.prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${this.lockKeyFor(babalawoId, date)})`;

      const isAvailable = await this.isTimeSlotAvailable(
        babalawoId,
        date,
        time,
        duration,
        tx,
        timezone
      );
      if (!isAvailable) {
        throw new ConflictException(
          'This time slot is already booked. Please choose another time.'
        );
      }

      return tx.appointment.create({
        data: {
          ...dto,
          scheduledAt,
          status: 'PENDING_CONFIRMATION',
          isPriority,
        },
        include: {
          babalawo: true,
          client: true,
        },
      });
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

    // WhatsApp: notify babalawo of new booking
    const babalawoUser = await this.prisma.user.findUnique({
      where: { id: babalawoId },
      select: { whatsappNumber: true, whatsappEnabled: true },
    });
    if (babalawoUser?.whatsappEnabled && babalawoUser?.whatsappNumber) {
      await this.whatsapp.notifyBabalawoNewBooking({
        phone: babalawoUser.whatsappNumber,
        clientName: appointment.client.name,
        date: appointment.date,
        time: appointment.time,
        url: 'https://iluase.com/practitioner/consultations',
      });
    }

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

      this.maybeAssignPersonalAwo(appointment.clientId, appointment.babalawoId).catch(() => {});
      this.maybeGrantReferralReward(appointment.clientId).catch(() => {});
      this.notificationService
        .scheduleFollowUpReminder(appointment.babalawoId, appointment.id, appointment.client.name)
        .catch(() => {});

      // Schedule a review request for the client 24 hours after appointment completion
      if (status === 'COMPLETED') {
        this.notificationService
          .scheduleReviewRequest(appointment.clientId, appointment.id, appointment.babalawo.name)
          .catch(() => {});
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
      // WhatsApp: notify client their booking is confirmed
      const clientUser = await this.prisma.user.findUnique({
        where: { id: appointment.clientId },
        select: { whatsappNumber: true, whatsappEnabled: true },
      });
      if (clientUser?.whatsappEnabled && clientUser?.whatsappNumber) {
        await this.whatsapp.notifyClientBookingConfirmed({
          phone: clientUser.whatsappNumber,
          babalawoName: appointment.babalawo.name,
          date: appointment.date,
          time: appointment.time,
          url: 'https://iluase.com/client/consultations',
        });
      }
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
      orderBy: [{ isPriority: 'desc' }, { date: 'asc' }, { time: 'asc' }],
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
        guidancePlan: { select: { id: true } },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
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

    const raw = babalawo.availability as unknown;

    if (!raw) {
      return [];
    }

    // Support extended format: { schedule, blackoutDates, timezone, advanceBookingDays, minNoticeHours }
    // as well as legacy flat array format
    let schedule: AvailabilitySlot[];
    let blackoutDates: string[] = [];
    let advanceBookingDays = 60;
    let minNoticeHours = 24;

    if (Array.isArray(raw)) {
      schedule = raw as AvailabilitySlot[];
    } else {
      const ext = raw as {
        schedule?: AvailabilitySlot[];
        blackoutDates?: string[];
        advanceBookingDays?: number;
        minNoticeHours?: number;
      };
      schedule = ext.schedule ?? [];
      blackoutDates = ext.blackoutDates ?? [];
      advanceBookingDays = ext.advanceBookingDays ?? 60;
      minNoticeHours = ext.minNoticeHours ?? 24;
    }

    // Enforce advance booking window
    const nowCheck = new Date();
    const requestDate = new Date(date);
    const diffDays = Math.floor(
      (requestDate.getTime() - nowCheck.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > advanceBookingDays) return [];

    // Enforce minimum notice
    const diffHours = (requestDate.getTime() - nowCheck.getTime()) / (1000 * 60 * 60);
    if (diffHours < minNoticeHours) return [];

    // Enforce blackout dates
    if (blackoutDates.includes(date)) return [];

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    const dailyAvailability = schedule.find((avail: AvailabilitySlot) => avail.day === dayOfWeek);

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
        const [rawHour, minute] = timePart.split(':').map(Number);
        let hour = rawHour;

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

    // P2-03: keep scheduledAt in sync whenever any of the three legacy
    // fields it's derived from actually changes.
    const scheduledAtUpdate =
      dto.date || dto.time || dto.timezone
        ? {
            scheduledAt: combineDateTimeInZone(
              dto.date ?? appointment.date,
              dto.time ?? appointment.time,
              dto.timezone ?? appointment.timezone
            ),
          }
        : {};

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        ...scheduledAtUpdate,
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
    const timezone = dto.timezone || DEFAULT_TIMEZONE;

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

    // Check if date/time is in the future (P2-03: timezone-aware, not server-local)
    const appointmentDateTime = combineDateTimeInZone(date, time, timezone);
    if (appointmentDateTime <= new Date()) {
      return {
        available: false,
        message: 'Appointment time must be in the future',
      };
    }

    // Check time slot availability
    const isAvailable = await this.isTimeSlotAvailable(
      babalawoId,
      date,
      time,
      durationNum,
      this.prisma,
      timezone
    );

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

  private async maybeAssignPersonalAwo(clientId: string, babalawoId: string) {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { personalAwoId: true },
    });
    if (client?.personalAwoId) return; // already set

    const count = await this.prisma.appointment.count({
      where: { clientId, babalawoId, status: 'COMPLETED' },
    });

    if (count >= 3) {
      await this.prisma.user.update({
        where: { id: clientId },
        data: { personalAwoId: babalawoId },
      });
    }
  }

  private async maybeGrantReferralReward(clientId: string) {
    // Only reward on the very first completed booking
    const completedCount = await this.prisma.appointment.count({
      where: { clientId, status: 'COMPLETED' },
    });
    if (completedCount !== 1) return; // 1 = this is the first completion

    const referral = await this.prisma.referral.findUnique({
      where: { referredId: clientId },
    });
    if (!referral || referral.rewardGranted) return;

    const REWARD_NGN = 500;

    const rewardDto = {
      amount: REWARD_NGN,
      currency: 'NGN' as any,
      reference: `referral_reward_${referral.id}`,
    };
    // Credit referrer wallet
    await this.walletService.depositFunds(referral.referrerId, rewardDto);
    // Credit referee wallet
    await this.walletService.depositFunds(clientId, {
      ...rewardDto,
      reference: `referral_welcome_${referral.id}`,
    });

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { rewardGranted: true },
    });

    // Notify both parties
    await this.notificationService.createNotification({
      userId: referral.referrerId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: '🎉 Referral reward earned!',
      message: `Your friend completed their first booking. ₦${REWARD_NGN} has been added to your wallet.`,
      data: { action: 'referral_reward', amount: REWARD_NGN },
      sendEmail: false,
      sendPush: false,
    });
    await this.notificationService.createNotification({
      userId: clientId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: '🎉 Welcome bonus earned!',
      message: `₦${REWARD_NGN} has been added to your wallet as a welcome gift from your referral.`,
      data: { action: 'referral_reward', amount: REWARD_NGN },
      sendEmail: false,
      sendPush: false,
    });
  }

  /**
   * Get completed appointments for a client (session history)
   * GET /appointments/client/:clientId/history
   */
  async getSessionHistory(clientId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own session history');
    }

    return this.prisma.appointment.findMany({
      where: {
        clientId,
        status: 'COMPLETED', // Only completed appointments in session history
      },
      include: {
        babalawo: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
        guidancePlan: { select: { id: true } },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }], // Most recent first
    });
  }

  /**
   * Generate a receipt for a completed appointment
   */
  async generateReceipt(id: string, currentUser: CurrentUserPayload) {
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

    // Check if user is authorized to access this appointment
    const isClient = currentUser.id === appointment.clientId;
    const isBabalawo = currentUser.id === appointment.babalawoId;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isClient && !isBabalawo && !isAdmin) {
      throw new ForbiddenException('You are not authorized to download this receipt');
    }

    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException('Receipts can only be generated for completed appointments');
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    // Stream events to capture the PDF data
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));

    // Add content to the PDF
    doc.fontSize(20).text('Ìlú Àṣẹ Receipt', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Receipt ID: ${appointment.id}`, { align: 'right' });
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.text(
      `Client: ${appointment.client.name}${appointment.client.yorubaName ? ` (${appointment.client.yorubaName})` : ''}`
    );
    doc.text(
      `Babalawo: ${appointment.babalawo.name}${appointment.babalawo.yorubaName ? ` (${appointment.babalawo.yorubaName})` : ''}`
    );
    doc.moveDown();

    doc.text(`Date: ${new Date(appointment.date).toLocaleDateString()}`);
    doc.text(`Time: ${appointment.time}`);
    doc.text(`Duration: ${appointment.duration} minutes`);
    doc.text(`Service: ${appointment.topic || 'Spiritual Consultation'}`);
    doc.moveDown();

    if (appointment.price && appointment.price > 0) {
      doc.text(`Amount Paid: ₦${Number(appointment.price).toLocaleString()}`);
      doc.text(`Payment Method: Wallet`); // Assuming wallet payment for now
    } else {
      doc.text('Amount Paid: Free Session');
    }
    doc.moveDown();

    doc.text('For spiritual services — not a medical document');
    doc.moveDown();

    doc.text('Ìlú Àṣẹ Platform', { align: 'center' });
    doc.text('Connecting the Yoruba diaspora with authentic spiritual guidance', {
      align: 'center',
    });

    // End the PDF document
    doc.end();

    // Wait for the stream to finish and return the PDF buffer
    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }
}
