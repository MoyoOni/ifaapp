import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminMarketplaceService } from './admin-marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

// Scoped to VND-017 (cultural certification review) -- the methods touched
// by this feature. Not full coverage of this service's many other
// (unrelated) vendor-health/bundle/event-feature methods.
describe('AdminMarketplaceService - cultural certification (VND-017)', () => {
  let service: AdminMarketplaceService;

  const mockPrismaService = {
    vendorCertificationApplication: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendor: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNotificationService.createNotification.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMarketplaceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AdminMarketplaceService>(AdminMarketplaceService);
  });

  describe('getCertificationApplications', () => {
    it('returns only PENDING applications with vendor info', async () => {
      mockPrismaService.vendorCertificationApplication.findMany.mockResolvedValue([]);

      await service.getCertificationApplications();

      expect(mockPrismaService.vendorCertificationApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } })
      );
    });
  });

  describe('reviewCertificationApplication', () => {
    it('404s when the application does not exist', async () => {
      mockPrismaService.vendorCertificationApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewCertificationApplication('app-1', { approved: true }, 'admin-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects reviewing an already-reviewed application', async () => {
      mockPrismaService.vendorCertificationApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'APPROVED',
        vendorId: 'vendor-1',
        requestedTier: 'ELDER_ENDORSED',
      });

      await expect(
        service.reviewCertificationApplication('app-1', { approved: true }, 'admin-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('on approval, upgrades the vendor tier and marks the application APPROVED', async () => {
      mockPrismaService.vendorCertificationApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'PENDING',
        vendorId: 'vendor-1',
        requestedTier: 'ELDER_ENDORSED',
      });
      mockPrismaService.vendorCertificationApplication.update.mockResolvedValue({
        id: 'app-1',
        status: 'APPROVED',
      });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'user-1' });

      await service.reviewCertificationApplication('app-1', { approved: true }, 'admin-1');

      expect(mockPrismaService.vendorCertificationApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED', declineReason: null }),
        })
      );
      expect(mockPrismaService.vendor.update).toHaveBeenCalledWith({
        where: { id: 'vendor-1' },
        data: { culturalCertificationTier: 'ELDER_ENDORSED' },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' })
      );
    });

    it('on decline, does not touch the vendor tier and records the reason', async () => {
      mockPrismaService.vendorCertificationApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        status: 'PENDING',
        vendorId: 'vendor-1',
        requestedTier: 'ELDER_ENDORSED',
      });
      mockPrismaService.vendorCertificationApplication.update.mockResolvedValue({
        id: 'app-1',
        status: 'DECLINED',
      });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'user-1' });

      await service.reviewCertificationApplication(
        'app-1',
        { approved: false, declineReason: 'Documentation insufficient' },
        'admin-1'
      );

      expect(mockPrismaService.vendorCertificationApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DECLINED',
            declineReason: 'Documentation insufficient',
          }),
        })
      );
      expect(mockPrismaService.vendor.update).not.toHaveBeenCalled();
    });
  });
});
