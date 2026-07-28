import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { NotificationService } from '../notifications/notification.service';
import { PaystackApiService } from '../payments/paystack-api.service';
import { addDays } from 'date-fns';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPrismaService = {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    referral: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const mockSesEmailService = {
    sendEmail: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockPaystackApiService = {
    disableSubscription: jest.fn().mockResolvedValue({ status: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.subscription.findFirst.mockResolvedValue(null);
    mockPrismaService.user.findUnique.mockResolvedValue({
      email: 'seeker@example.com',
      name: 'Test Seeker',
    });
    mockPrismaService.referral.findUnique.mockResolvedValue(null);
    mockPaystackApiService.disableSubscription.mockResolvedValue({ status: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SesEmailService, useValue: mockSesEmailService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PaystackApiService, useValue: mockPaystackApiService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('initiateSubscription (V8-103: must fail loudly, not silently degrade to a one-time charge)', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('throws instead of calling Paystack when the plan-code env var is unset', async () => {
      process.env = { ...originalEnv, PAYSTACK_DEVOTED_QUARTERLY_PLAN: undefined };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'seeker@example.com' });
      const fetchSpy = jest.spyOn(global, 'fetch');

      await expect(service.initiateSubscription('user-1', 'QUARTERLY')).rejects.toThrow(
        'Devoted subscriptions are not yet available'
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhookEvent — subscription.create (EMG-03 idempotency)', () => {
    const basePayload = {
      event: 'subscription.create',
      data: {
        metadata: { userId: 'user-1', plan: 'QUARTERLY' },
        subscription_code: 'SUB_123',
        reference: 'ref-abc',
        amount: 2_500_000,
      },
    };

    it('creates a new subscription when no matching record exists', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);
      mockPrismaService.subscription.create.mockResolvedValue({ id: 'sub-row-1' });

      await service.handleWebhookEvent(basePayload);

      expect(mockPrismaService.subscription.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            OR: expect.arrayContaining([{ paystackSubId: 'SUB_123' }, { paystackRef: 'ref-abc' }]),
          }),
        })
      );
      expect(mockPrismaService.subscription.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);
    });

    it('does not create a duplicate subscription when the same webhook is replayed', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'existing-sub-row',
        paystackSubId: 'SUB_123',
        paystackRef: 'ref-abc',
      });

      await service.handleWebhookEvent(basePayload);

      expect(mockPrismaService.subscription.create).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });

    it('still processes when metadata has no plan/userId (logs and returns, no throw)', async () => {
      await expect(
        service.handleWebhookEvent({ event: 'subscription.create', data: { metadata: {} } })
      ).resolves.toBeUndefined();

      expect(mockPrismaService.subscription.create).not.toHaveBeenCalled();
    });

    it('HUMAN_BACKLOG.md: stores email_token from the webhook payload for later cancellation', async () => {
      mockPrismaService.subscription.create.mockResolvedValue({ id: 'sub-row-1' });

      await service.handleWebhookEvent({
        ...basePayload,
        data: { ...basePayload.data, email_token: 'email_token_abc' },
      });

      expect(mockPrismaService.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paystackEmailToken: 'email_token_abc' }),
        })
      );
    });
  });

  describe('rewardReferrer via handleWebhookEvent (V8-501: independent flag from EXP-027 booking reward)', () => {
    const payload = {
      event: 'subscription.create',
      data: {
        metadata: { userId: 'new-subscriber', plan: 'QUARTERLY' },
        subscription_code: 'SUB_999',
        reference: 'ref-999',
        amount: 2_500_000,
      },
    };

    beforeEach(() => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);
      mockPrismaService.subscription.create.mockResolvedValue({ id: 'sub-row-1' });
      mockPrismaService.subscription.updateMany.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'referrer-1') {
          return Promise.resolve({ subscriptionStatus: 'FREE', subscriptionEnd: null });
        }
        return Promise.resolve({ email: 'seeker@example.com', name: 'Test Seeker' });
      });
    });

    it('grants the referrer 30 free Devoted days and flips subscriptionRewardGranted, leaving rewardGranted untouched', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'referral-1',
        referrerId: 'referrer-1',
        referredId: 'new-subscriber',
        rewardGranted: true, // EXP-027's ₦500 booking reward already paid out separately
        subscriptionRewardGranted: false,
      });

      await service.handleWebhookEvent(payload);

      expect(mockPrismaService.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'referrer-1', amountPaid: 0 }) })
      );
      expect(mockPrismaService.referral.update).toHaveBeenCalledWith({
        where: { id: 'referral-1' },
        data: { subscriptionRewardGranted: true },
      });
    });

    it('does not re-grant if subscriptionRewardGranted is already true, even if rewardGranted is false', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'referral-1',
        referrerId: 'referrer-1',
        referredId: 'new-subscriber',
        rewardGranted: false, // EXP-027 booking reward not yet paid -- independent of this one
        subscriptionRewardGranted: true,
      });

      await service.handleWebhookEvent(payload);

      expect(mockPrismaService.referral.update).not.toHaveBeenCalled();
      // Only the subscriber's own subscription.create should have happened, not a second one for the referrer
      expect(mockPrismaService.subscription.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('runExpirySweep (V8-404/504 prerequisite: nothing previously ever set status EXPIRED)', () => {
    it('expires lapsed non-renewing subscriptions and flips the user back to FREE', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([
        { id: 'sub-1', userId: 'user-1' },
        { id: 'sub-2', userId: 'user-2' },
      ]);
      mockPrismaService.subscription.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      const count = await service.runExpirySweep();

      expect(count).toBe(2);
      expect(mockPrismaService.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['ACTIVE', 'PAST_DUE'] },
            autoRenew: false,
            endDate: { lt: expect.any(Date) },
          }),
        })
      );
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'EXPIRED' },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { subscriptionStatus: 'FREE' },
      });
    });

    it('is a no-op when nothing has lapsed', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);

      const count = await service.runExpirySweep();

      expect(count).toBe(0);
      expect(mockPrismaService.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('runRenewalReminderSweep (V8-404: real daily 9am trigger, not reactive-only)', () => {
    it('emails everyone due within 3 days and marks reminderSent', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([
        {
          id: 'sub-1',
          plan: 'QUARTERLY',
          endDate: addDays(new Date(), 2),
          user: { email: 'seeker@example.com', name: 'Test Seeker' },
        },
      ]);
      mockPrismaService.subscription.update.mockResolvedValue({});

      const count = await service.runRenewalReminderSweep();

      expect(count).toBe(1);
      expect(mockSesEmailService.sendEmail).toHaveBeenCalledWith(
        'seeker@example.com',
        expect.stringContaining('renews in'),
        expect.any(String)
      );
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { reminderSent: true },
      });
    });

    it('only queries subscriptions that still need a reminder', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);

      await service.runRenewalReminderSweep();

      expect(mockPrismaService.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE', autoRenew: true, reminderSent: false }),
        })
      );
    });
  });

  describe('runWinBackSweep (V8-504: exactly-once, 7-days-after-expiry trigger)', () => {
    it('sends the win-back email and stamps winBackSentAt for a subscription that expired 7 days ago', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([{ id: 'sub-1', userId: 'user-1' }]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        email: 'lapsed@example.com',
        name: 'Lapsed User',
        subscriptionStatus: 'FREE',
      });
      mockPrismaService.subscription.update.mockResolvedValue({});

      const count = await service.runWinBackSweep();

      expect(count).toBe(1);
      expect(mockSesEmailService.sendEmail).toHaveBeenCalledWith(
        'lapsed@example.com',
        expect.stringContaining('Devoted journey'),
        expect.any(String)
      );
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { winBackSentAt: expect.any(Date) },
      });
    });

    it('only queries EXPIRED subscriptions that have not already received a win-back email', async () => {
      mockPrismaService.subscription.findMany.mockResolvedValue([]);

      await service.runWinBackSweep();

      expect(mockPrismaService.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'EXPIRED', winBackSentAt: null }),
        })
      );
    });
  });

  describe('setAutoRenew (V8-401: lighter-weight toggle, stays ACTIVE unlike cancel)', () => {
    it('turns auto-renew off and disables the Paystack subscription, without changing status', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        autoRenew: true,
        endDate: new Date('2027-01-01'),
        paystackSubId: 'SUB_code',
        paystackEmailToken: 'email_token_abc',
      });
      mockPrismaService.subscription.update.mockResolvedValue({});

      const result = await service.setAutoRenew('user-1', false);

      expect(mockPaystackApiService.disableSubscription).toHaveBeenCalledWith('SUB_code', 'email_token_abc');
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { autoRenew: false },
      });
      expect(result.autoRenew).toBe(false);
    });

    it('turns auto-renew back on and re-enables the Paystack subscription when not yet lapsed', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        autoRenew: false,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paystackSubId: 'SUB_code',
        paystackEmailToken: 'email_token_abc',
      });
      mockPrismaService.subscription.update.mockResolvedValue({});
      mockPaystackApiService.enableSubscription = jest.fn().mockResolvedValue({ status: true });

      const result = await service.setAutoRenew('user-1', true);

      expect(mockPaystackApiService.enableSubscription).toHaveBeenCalledWith('SUB_code', 'email_token_abc');
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { autoRenew: true },
      });
      expect(result.autoRenew).toBe(true);
    });

    it('refuses to turn auto-renew back on for an already-lapsed subscription', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        autoRenew: false,
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paystackSubId: 'SUB_code',
        paystackEmailToken: 'email_token_abc',
      });

      await expect(service.setAutoRenew('user-1', true)).rejects.toThrow('already lapsed');
      expect(mockPrismaService.subscription.update).not.toHaveBeenCalled();
    });

    it('is a no-op when the requested state already matches', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        autoRenew: true,
        endDate: new Date('2027-01-01'),
      });

      const result = await service.setAutoRenew('user-1', true);

      expect(result.message).toContain('already');
      expect(mockPrismaService.subscription.update).not.toHaveBeenCalled();
    });

    it('404s when there is no active subscription', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.setAutoRenew('user-1', false)).rejects.toThrow('No active subscription found');
    });
  });

  describe('pauseSubscription (V8-503: only once per subscription lifetime)', () => {
    it('extends endDate by 30 days and stamps pausedAt on first use', async () => {
      const endDate = new Date('2026-08-01T00:00:00.000Z');
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        endDate,
        pausedAt: null,
      });
      mockPrismaService.subscription.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.pauseSubscription('user-1');

      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            pausedAt: expect.any(Date),
            endDate: new Date('2026-08-31T00:00:00.000Z'),
          }),
        })
      );
      expect(result.newEndDate).toBe(new Date('2026-08-31T00:00:00.000Z').toISOString());
    });

    it('rejects a second pause on the same subscription -- no free indefinite extension', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        status: 'ACTIVE',
        endDate: new Date('2026-08-01'),
        pausedAt: new Date('2026-07-01'), // already used
      });

      await expect(service.pauseSubscription('user-1')).rejects.toThrow(
        'You have already used your pause for this subscription.'
      );
      expect(mockPrismaService.subscription.update).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('404s when there is no active subscription', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.pauseSubscription('user-1')).rejects.toThrow('No active subscription found');
    });
  });

  describe('getMySubscription (V8-201: canPause must reflect the real pausedAt flag)', () => {
    it('reports canPause: true for a subscription that has never been paused', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        subscriptionStatus: 'DEVOTED',
        subscriptionEnd: new Date('2027-01-01'),
      });
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        plan: 'QUARTERLY',
        endDate: new Date('2027-01-01'),
        autoRenew: true,
        reminderSent: true,
        pausedAt: null,
      });

      const result = await service.getMySubscription('user-1');
      expect(result.canPause).toBe(true);
    });

    it('reports canPause: false once pausedAt is set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        subscriptionStatus: 'DEVOTED',
        subscriptionEnd: new Date('2027-01-01'),
      });
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        plan: 'QUARTERLY',
        endDate: new Date('2027-01-01'),
        autoRenew: true,
        reminderSent: true,
        pausedAt: new Date('2026-06-01'),
      });

      const result = await service.getMySubscription('user-1');
      expect(result.canPause).toBe(false);
    });
  });

  describe('cancelSubscription (HUMAN_BACKLOG.md: must actually reach Paystack)', () => {
    const activeSub = {
      id: 'sub-1',
      userId: 'user-1',
      status: 'ACTIVE',
      endDate: new Date('2027-01-01'),
      paystackSubId: 'SUB_code',
      paystackEmailToken: 'email_token_abc',
    };

    it('calls PaystackApiService.disableSubscription with the stored code and email token', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(activeSub);
      mockPrismaService.subscription.update.mockResolvedValue({ ...activeSub, status: 'CANCELLED' });

      await service.cancelSubscription('user-1');

      expect(mockPaystackApiService.disableSubscription).toHaveBeenCalledWith('SUB_code', 'email_token_abc');
      expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { autoRenew: false, status: 'CANCELLED' },
      });
    });

    it('skips the Paystack call (but still cancels locally) when an older row has no stored email token', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        ...activeSub,
        paystackEmailToken: null,
      });
      mockPrismaService.subscription.update.mockResolvedValue({ ...activeSub, status: 'CANCELLED' });

      const result = await service.cancelSubscription('user-1');

      expect(mockPaystackApiService.disableSubscription).not.toHaveBeenCalled();
      expect(mockPrismaService.subscription.update).toHaveBeenCalled();
      expect(result.message).toContain('cancelled');
    });

    it('still cancels locally when the Paystack call itself throws', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(activeSub);
      mockPrismaService.subscription.update.mockResolvedValue({ ...activeSub, status: 'CANCELLED' });
      mockPaystackApiService.disableSubscription.mockRejectedValue(new Error('network error'));

      await expect(service.cancelSubscription('user-1')).resolves.toBeDefined();
      expect(mockPrismaService.subscription.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when there is no active subscription', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-1')).rejects.toThrow('No active subscription found');
    });
  });
});
