import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { NotificationService } from '../notifications/notification.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPrismaService = {
    subscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    referral: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSesEmailService = {
    sendEmail: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.subscription.findFirst.mockResolvedValue(null);
    mockPrismaService.user.findUnique.mockResolvedValue({
      email: 'seeker@example.com',
      name: 'Test Seeker',
    });
    mockPrismaService.referral.findUnique.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SesEmailService, useValue: mockSesEmailService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
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
  });
});
