import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminReferralsService } from './admin-referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notifications/notification.service';
import { AppointmentsService } from '../appointments/appointments.service';

// VENDOR_BACKLOG.md VND-021 / ILUASE_V1_BACKLOG.md fix: creditReferral() used
// to just flip a boolean with no money moving. These tests cover the real
// wallet-crediting behavior now that it does.
describe('AdminReferralsService', () => {
  let service: AdminReferralsService;
  let prisma: { referral: { findUnique: jest.Mock; update: jest.Mock; count: jest.Mock; findMany: jest.Mock }; user: { findMany: jest.Mock }; $queryRaw: jest.Mock };
  let walletService: { depositFunds: jest.Mock };
  let notificationService: { createNotification: jest.Mock };

  beforeEach(async () => {
    prisma = {
      referral: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn(), findMany: jest.fn() },
      user: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
    };
    walletService = { depositFunds: jest.fn().mockResolvedValue({}) };
    notificationService = { createNotification: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReferralsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(AdminReferralsService);
  });

  describe('creditReferral', () => {
    const mockReferral = {
      id: 'referral-1',
      referrerId: 'referrer-1',
      referredId: 'referred-1',
      rewardGranted: false,
      referrer: { id: 'referrer-1', name: 'Ade', email: 'ade@example.com' },
    };

    it('credits AppointmentsService.REFERRAL_REWARD_NGN to both the referrer and referred wallets', async () => {
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referral.update.mockResolvedValue({ ...mockReferral, rewardGranted: true });

      await service.creditReferral('referral-1');

      expect(walletService.depositFunds).toHaveBeenCalledWith(
        'referrer-1',
        expect.objectContaining({ amount: AppointmentsService.REFERRAL_REWARD_NGN, currency: 'NGN' })
      );
      expect(walletService.depositFunds).toHaveBeenCalledWith(
        'referred-1',
        expect.objectContaining({ amount: AppointmentsService.REFERRAL_REWARD_NGN, currency: 'NGN' })
      );
      expect(walletService.depositFunds).toHaveBeenCalledTimes(2);
    });

    it('uses distinct idempotency references for the referrer vs. referred deposit', async () => {
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referral.update.mockResolvedValue({ ...mockReferral, rewardGranted: true });

      await service.creditReferral('referral-1');

      const referrerCall = walletService.depositFunds.mock.calls.find((c) => c[0] === 'referrer-1');
      const referredCall = walletService.depositFunds.mock.calls.find((c) => c[0] === 'referred-1');
      expect(referrerCall![1].reference).not.toBe(referredCall![1].reference);
    });

    it('marks the referral rewardGranted after crediting', async () => {
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referral.update.mockResolvedValue({ ...mockReferral, rewardGranted: true });

      await service.creditReferral('referral-1');

      expect(prisma.referral.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'referral-1' }, data: { rewardGranted: true } })
      );
    });

    it('notifies both the referrer and the referred user', async () => {
      prisma.referral.findUnique.mockResolvedValue(mockReferral);
      prisma.referral.update.mockResolvedValue({ ...mockReferral, rewardGranted: true });

      await service.creditReferral('referral-1');

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'referrer-1' })
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'referred-1' })
      );
    });

    it('throws NotFoundException for a referral that does not exist', async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      await expect(service.creditReferral('missing')).rejects.toThrow(NotFoundException);
      expect(walletService.depositFunds).not.toHaveBeenCalled();
    });

    it('throws BadRequestException and moves no money for an already-rewarded referral', async () => {
      prisma.referral.findUnique.mockResolvedValue({ ...mockReferral, rewardGranted: true });

      await expect(service.creditReferral('referral-1')).rejects.toThrow(BadRequestException);
      expect(walletService.depositFunds).not.toHaveBeenCalled();
      expect(prisma.referral.update).not.toHaveBeenCalled();
    });
  });
});
