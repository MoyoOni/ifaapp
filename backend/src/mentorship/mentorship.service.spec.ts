import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EscrowType } from '@ile-ase/common';
import { MentorshipService } from './mentorship.service';
import { mockRestrictions } from '../../test/mocks/safeguarding.mock';
import { PRACTITIONER_STANDARDS } from '../safeguarding/standards';

// SHOP_BACKLOG.md MSP-023 -- owner's rules: Devoted clients only, verified
// babalawos only, paid here and held elsewhere, 0% platform commission.
describe('MentorshipService', () => {
  const client = { id: 'client-1', role: 'CLIENT' } as any;
  const babalawo = { id: 'baba-1', role: 'BABALAWO' } as any;
  const offering = {
    id: 'off-1', babalawoId: 'baba-1', name: '4 readings', priceAmount: 40000, priceCurrency: 'NGN', sessionCount: 4,
    babalawo: { id: 'baba-1', name: 'Awo Fálànà', role: 'BABALAWO', verified: true, standardsVersionAccepted: PRACTITIONER_STANDARDS.version },
  };
  const booking = (over: Record<string, unknown> = {}) => ({
    id: 'bk-1', offeringId: 'off-1', babalawoId: 'baba-1', clientId: 'client-1', status: 'PAID', amount: 40000, currency: 'NGN',
    sessionsTotal: 4, sessionsHeld: 0, sessionsConfirmed: 0, escrowId: 'esc-1', offering: { name: '4 readings' }, ...over,
  });

  let prisma: any;
  let wallet: any;
  let notifications: any;
  let restrictions: ReturnType<typeof mockRestrictions>;
  let service: MentorshipService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ subscriptionStatus: 'DEVOTED', subscriptionEnd: new Date(Date.now() + 30 * 86400000) }) },
      subscription: { findFirst: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      serviceOffering: { findFirst: jest.fn().mockResolvedValue(offering), findMany: jest.fn() },
      mentorshipBooking: {
        create: jest.fn((a) => Promise.resolve({ id: 'bk-new', ...a.data })),
        findUnique: jest.fn(),
        update: jest.fn((a) => Promise.resolve({ id: a.where.id, ...a.data })),
      },
    };
    wallet = {
      createExternallyFundedEscrow: jest.fn().mockResolvedValue({ id: 'esc-1' }),
      releaseEscrow: jest.fn().mockResolvedValue({}),
      cancelEscrow: jest.fn().mockResolvedValue({}),
      armAutoRelease: jest.fn().mockResolvedValue(undefined),
    };
    notifications = { createNotification: jest.fn().mockResolvedValue({}) };
    restrictions = mockRestrictions();
    service = new MentorshipService(prisma, wallet, notifications, restrictions as never);
  });

  describe('booking', () => {
    it('prices the booking from the offering, not from the client', async () => {
      const created = await service.createBooking({ offeringId: 'off-1', note: 'Guidance on my path' }, client);
      expect(created).toMatchObject({ amount: 40000, currency: 'NGN', sessionsTotal: 4, clientId: 'client-1', babalawoId: 'baba-1' });
    });

    it('is for Devoted members only', async () => {
      prisma.user.findUnique.mockResolvedValue({ subscriptionStatus: 'FREE' });
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('needs a current Devoted membership, not just the flag (the shared rule in subscriptions/devoted.ts)', async () => {
      prisma.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED', subscriptionEnd: new Date(Date.now() - 86400000) });
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('is only offered by verified babalawos', async () => {
      prisma.serviceOffering.findFirst.mockResolvedValue({ ...offering, babalawo: { ...offering.babalawo, verified: false } });
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is not offered by a practitioner who has not accepted the current standards (SAFE-12)', async () => {
      prisma.serviceOffering.findFirst.mockResolvedValue({ ...offering, babalawo: { ...offering.babalawo, standardsVersionAccepted: 'older' } });
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is refused while the practitioner has bookings paused, or a no-contact restriction applies (SAFE-05)', async () => {
      restrictions.assertNot.mockRejectedValueOnce(new ForbiddenException('paused'));
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(ForbiddenException);
      restrictions.assertContactAllowed.mockRejectedValueOnce(new ForbiddenException('not available'));
      await expect(service.createBooking({ offeringId: 'off-1' }, client)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.mentorshipBooking.create).not.toHaveBeenCalled();
    });

    it('cannot be made with yourself', async () => {
      prisma.user.findUnique.mockResolvedValue({ subscriptionStatus: 'DEVOTED', subscriptionEnd: new Date(Date.now() + 30 * 86400000) });
      await expect(service.createBooking({ offeringId: 'off-1' }, babalawo)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('payment', () => {
    it('tells PaymentsService what the client owes, only for their own unpaid booking', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ status: 'PENDING_PAYMENT' }));
      await expect(service.amountOwed('bk-1', 'client-1')).resolves.toEqual({ amount: 40000, currency: 'NGN' });
      await expect(service.amountOwed('bk-1', 'someone-else')).rejects.toBeInstanceOf(BadRequestException);
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ status: 'PAID' }));
      await expect(service.amountOwed('bk-1', 'client-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('holds the full price in a mentorship escrow for the babalawo once paid', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ status: 'PENDING_PAYMENT', escrowId: null }));
      await service.markPaid('bk-1', { userId: 'client-1', amount: 40000, transactionId: 'ref-1' });
      expect(wallet.createExternallyFundedEscrow).toHaveBeenCalledWith(
        'client-1',
        expect.objectContaining({ recipientId: 'baba-1', amount: 40000, type: EscrowType.MENTORSHIP_SESSION, relatedId: 'bk-1' }),
        // Sessions can run past 14 days: no refund-on-timeout.
        { refundIfUndelivered: false }
      );
      expect(prisma.mentorshipBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PAID', escrowId: 'esc-1' }) })
      );
    });

    it('ignores a payment that does not cover the booking', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ status: 'PENDING_PAYMENT', escrowId: null }));
      await service.markPaid('bk-1', { userId: 'client-1', amount: 1, transactionId: 'ref-1' });
      expect(wallet.createExternallyFundedEscrow).not.toHaveBeenCalled();
      expect(prisma.mentorshipBooking.update).not.toHaveBeenCalled();
    });
  });

  describe('sessions', () => {
    it('lets the client confirm only sessions the babalawo has marked held', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 0 }));
      await expect(service.confirmSession('bk-1', client)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('releases the escrow only when every session in a bundle is confirmed', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 2, sessionsConfirmed: 1 }));
      await service.confirmSession('bk-1', client);
      expect(wallet.releaseEscrow).not.toHaveBeenCalled();

      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 4, sessionsConfirmed: 3 }));
      const done = await service.confirmSession('bk-1', client);
      expect(wallet.releaseEscrow).toHaveBeenCalledWith('client-1', { escrowId: 'esc-1' }, client);
      expect(done).toMatchObject({ status: 'COMPLETED', sessionsConfirmed: 4 });
    });

    it('does not let the babalawo confirm their own sessions', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 4, sessionsConfirmed: 3 }));
      await expect(service.confirmSession('bk-1', babalawo)).rejects.toBeInstanceOf(NotFoundException);
      expect(wallet.releaseEscrow).not.toHaveBeenCalled();
    });
  });

  describe('auto-release', () => {
    it('starts the 14-day auto-release once the last session is marked held, not before', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 2 }));
      prisma.mentorshipBooking.update.mockResolvedValueOnce({ ...booking(), sessionsHeld: 3 });
      await service.markSessionHeld('bk-1', babalawo);
      expect(wallet.armAutoRelease).not.toHaveBeenCalled();

      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 3 }));
      prisma.mentorshipBooking.update.mockResolvedValueOnce({ ...booking(), sessionsHeld: 4 });
      await service.markSessionHeld('bk-1', babalawo);
      expect(wallet.armAutoRelease).toHaveBeenCalledWith('esc-1');
    });
  });

  describe('cancelling', () => {
    it('refunds a paid booking to the client before any session is held', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking());
      await service.cancel('bk-1', babalawo);
      expect(wallet.cancelEscrow).toHaveBeenCalledWith('client-1', 'esc-1', babalawo);
    });

    it('is refused once a session has been held', async () => {
      prisma.mentorshipBooking.findUnique.mockResolvedValue(booking({ sessionsHeld: 1 }));
      await expect(service.cancel('bk-1', client)).rejects.toBeInstanceOf(BadRequestException);
      expect(wallet.cancelEscrow).not.toHaveBeenCalled();
    });
  });
});
