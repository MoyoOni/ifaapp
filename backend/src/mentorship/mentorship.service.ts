import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  forwardRef,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Currency, EscrowType, UserRole } from '@ile-ase/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import {
  NotificationCategory,
  NotificationService,
  NotificationType,
} from '../notifications/notification.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateMentorshipBookingDto, SetMeetingDto } from './dto/mentorship.dto';

/**
 * SHOP_BACKLOG.md MSP-023 -- paid mentorship sessions (owner's decisions,
 * October 30, 2026):
 *  - only verified babalawos may sell them; only Devoted members may book;
 *  - booked and paid on Ìlú Àṣẹ, held elsewhere (the babalawo adds a
 *    meeting link) -- Consultations/messaging stay paused;
 *  - the platform keeps 0%: the MENTORSHIP_SESSION escrow is released in
 *    full to the babalawo once the client confirms every session.
 *
 * Status: PENDING_PAYMENT -> PAID -> COMPLETED, or CANCELLED (refunded to
 * the client's wallet if it had been paid). Payment is confirmed by
 * PaymentsService (purpose MENTORSHIP_SESSION), which calls markPaid.
 */
@Injectable()
export class MentorshipService {
  private readonly logger = new Logger(MentorshipService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService
  ) {}

  /** Mentorship offerings from verified babalawos, for anyone to browse. */
  async listOfferings() {
    return this.prisma.serviceOffering.findMany({
      where: {
        isMentorship: true,
        isActive: true,
        deletedAt: null,
        babalawo: { role: UserRole.BABALAWO, verified: true },
      },
      include: {
        babalawo: { select: { id: true, name: true, yorubaName: true, avatar: true, slug: true, culturalLevel: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBooking(dto: CreateMentorshipBookingDto, currentUser: CurrentUserPayload) {
    // Same definition of Devoted as GET /subscriptions/me (what the page
    // shows): the user flag *and* an active subscription.
    const [client, activeSub] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: currentUser.id }, select: { subscriptionStatus: true } }),
      this.prisma.subscription.findFirst({ where: { userId: currentUser.id, status: 'ACTIVE' }, select: { id: true } }),
    ]);
    if (client?.subscriptionStatus !== 'DEVOTED' || !activeSub) {
      throw new ForbiddenException('Paid mentorship sessions are part of the Devoted membership');
    }
    const offering = await this.prisma.serviceOffering.findFirst({
      where: { id: dto.offeringId, isMentorship: true, isActive: true, deletedAt: null },
      include: { babalawo: { select: { id: true, name: true, role: true, verified: true } } },
    });
    if (!offering || offering.babalawo.role !== UserRole.BABALAWO || !offering.babalawo.verified) {
      throw new NotFoundException('Mentorship offering not found');
    }
    if (offering.babalawoId === currentUser.id) {
      throw new BadRequestException('You cannot book your own session');
    }

    return this.prisma.mentorshipBooking.create({
      data: {
        offeringId: offering.id,
        babalawoId: offering.babalawoId,
        clientId: currentUser.id,
        amount: offering.priceAmount,
        currency: offering.priceCurrency,
        sessionsTotal: offering.sessionCount,
        clientNote: dto.note,
      },
    });
  }

  /** Bookings where the current user is the client or the babalawo. */
  async listMine(currentUser: CurrentUserPayload) {
    const person = { select: { id: true, name: true, yorubaName: true, avatar: true } };
    return this.prisma.mentorshipBooking.findMany({
      where: {
        OR: [{ clientId: currentUser.id }, { babalawoId: currentUser.id }],
        NOT: { status: 'PENDING_PAYMENT', babalawoId: currentUser.id },
      },
      include: {
        offering: { select: { id: true, name: true, durationMinutes: true } },
        client: person,
        babalawo: person,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * What the client owes for a booking -- used by PaymentsService so the
   * charge is never taken from the browser.
   */
  async amountOwed(bookingId: string | undefined, userId: string): Promise<{ amount: number; currency: Currency }> {
    const booking = bookingId ? await this.prisma.mentorshipBooking.findUnique({ where: { id: bookingId } }) : null;
    if (!booking || booking.clientId !== userId) {
      throw new BadRequestException('Mentorship booking not found');
    }
    if (booking.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('This booking is not awaiting payment');
    }
    return { amount: Number(booking.amount), currency: booking.currency as Currency };
  }

  /** Called by PaymentsService once Paystack confirms the full amount. */
  async markPaid(bookingId: string, payment: { userId: string; amount: number; transactionId: string }) {
    const booking = await this.prisma.mentorshipBooking.findUnique({
      where: { id: bookingId },
      include: { offering: { select: { name: true } } },
    });
    if (!booking || booking.clientId !== payment.userId || booking.status !== 'PENDING_PAYMENT') {
      this.logger.warn(`Mentorship payment ${payment.transactionId} does not match a booking awaiting payment (${bookingId})`);
      return;
    }
    if (payment.amount + 0.005 < Number(booking.amount)) {
      this.logger.error(`Mentorship payment ${payment.transactionId} (${payment.amount}) does not cover booking ${bookingId}`);
      return;
    }

    const escrow = await this.walletService.createExternallyFundedEscrow(booking.clientId, {
      recipientId: booking.babalawoId,
      amount: Number(booking.amount),
      currency: booking.currency as Currency,
      type: EscrowType.MENTORSHIP_SESSION,
      relatedId: booking.id,
      notes: `Mentorship: ${booking.offering.name}`,
    });

    await this.prisma.mentorshipBooking.update({
      where: { id: booking.id },
      data: { status: 'PAID', paidAt: new Date(), paymentReference: payment.transactionId, escrowId: escrow.id },
    });
    await this.notify(
      booking.babalawoId,
      'New mentorship booking',
      `A member has booked and paid for "${booking.offering.name}". Add where and when you will meet.`,
      booking.id
    );
  }

  async setMeeting(bookingId: string, dto: SetMeetingDto, currentUser: CurrentUserPayload) {
    const booking = await this.findFor(bookingId, currentUser, 'babalawo');
    if (booking.status !== 'PAID') throw new BadRequestException('Only a paid booking can be scheduled');
    const updated = await this.prisma.mentorshipBooking.update({
      where: { id: booking.id },
      data: { meetingLink: dto.meetingLink.trim(), meetingDetails: dto.meetingDetails?.trim() || null },
    });
    await this.notify(booking.clientId, 'Your mentorship session is set', 'Your babalawo has shared where and when you will meet.', booking.id);
    return updated;
  }

  /** The babalawo records that a session took place. */
  async markSessionHeld(bookingId: string, currentUser: CurrentUserPayload) {
    const booking = await this.findFor(bookingId, currentUser, 'babalawo');
    if (booking.status !== 'PAID') throw new BadRequestException('Only a paid booking can have sessions');
    if (booking.sessionsHeld >= booking.sessionsTotal) throw new BadRequestException('All sessions are already marked held');
    const updated = await this.prisma.mentorshipBooking.update({
      where: { id: booking.id },
      data: { sessionsHeld: { increment: 1 } },
    });
    await this.notify(
      booking.clientId,
      'Please confirm your session',
      'Your babalawo has marked a session as held. Confirm it so they are paid.',
      booking.id
    );
    return updated;
  }

  /**
   * The client confirms a held session. When every session is confirmed the
   * escrow is released in full to the babalawo (0% platform commission).
   */
  async confirmSession(bookingId: string, currentUser: CurrentUserPayload) {
    const booking = await this.findFor(bookingId, currentUser, 'client');
    if (booking.status !== 'PAID') throw new BadRequestException('Only a paid booking can be confirmed');
    if (booking.sessionsConfirmed >= booking.sessionsHeld) {
      throw new BadRequestException('There is no held session waiting for your confirmation');
    }
    const confirmed = booking.sessionsConfirmed + 1;
    const done = confirmed >= booking.sessionsTotal;

    if (done && booking.escrowId) {
      await this.walletService.releaseEscrow(currentUser.id, { escrowId: booking.escrowId }, currentUser);
    }
    const updated = await this.prisma.mentorshipBooking.update({
      where: { id: booking.id },
      data: { sessionsConfirmed: confirmed, ...(done ? { status: 'COMPLETED', completedAt: new Date() } : {}) },
    });
    if (done) {
      await this.notify(booking.babalawoId, 'Mentorship complete', 'Your client confirmed every session. Payment has been released to your wallet.', booking.id);
    }
    return updated;
  }

  /**
   * Either side may cancel before any session has been held; a paid booking
   * is refunded to the client's wallet.
   */
  async cancel(bookingId: string, currentUser: CurrentUserPayload) {
    const booking = await this.findFor(bookingId, currentUser, 'either');
    if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PAID') {
      throw new BadRequestException(`A ${booking.status.toLowerCase()} booking cannot be cancelled`);
    }
    if (booking.sessionsHeld > 0) {
      throw new BadRequestException('A session has already been held; contact support to resolve this booking');
    }
    if (booking.status === 'PAID' && booking.escrowId) {
      await this.walletService.cancelEscrow(booking.clientId, booking.escrowId, currentUser);
    }
    const updated = await this.prisma.mentorshipBooking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById: currentUser.id },
    });
    if (booking.status === 'PAID') {
      const other = currentUser.id === booking.clientId ? booking.babalawoId : booking.clientId;
      await this.notify(other, 'Mentorship booking cancelled', 'A paid mentorship booking was cancelled and refunded to the member\'s wallet.', booking.id);
    }
    return updated;
  }

  private async findFor(bookingId: string, currentUser: CurrentUserPayload, as: 'client' | 'babalawo' | 'either') {
    const booking = await this.prisma.mentorshipBooking.findUnique({ where: { id: bookingId } });
    const isClient = booking?.clientId === currentUser.id;
    const isBabalawo = booking?.babalawoId === currentUser.id;
    const allowed = as === 'client' ? isClient : as === 'babalawo' ? isBabalawo : isClient || isBabalawo;
    if (!booking || !allowed) throw new NotFoundException('Booking not found');
    return booking;
  }

  private async notify(userId: string, title: string, message: string, bookingId: string) {
    await this.notificationService
      .createNotification({
        userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title,
        message,
        data: { mentorshipBookingId: bookingId, link: '/mentorship/bookings' },
      })
      .catch((err) => this.logger.error(`Mentorship notification failed: ${(err as Error).message}`));
  }
}
