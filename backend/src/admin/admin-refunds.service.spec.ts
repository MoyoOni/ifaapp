import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminRefundsService } from './admin-refunds.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { AuditService } from './audit.service';
import { NotificationService } from '../notifications/notification.service';
import { Prisma } from '@prisma/client';

// ProBacklog-v1.md item #15 (Float->Decimal migration): RefundRequest.amount/
// approvedAmount are now Decimal. There was no test coverage on this action
// at all before this pass -- notably the live bug this migration surfaced:
// approvedAmount.toLocaleString() would throw once request.amount stopped
// being a plain number, since Prisma.Decimal has no such method.
describe('AdminRefundsService', () => {
  let service: AdminRefundsService;

  const mockPrismaService = {
    refundRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockWalletService = {
    depositFunds: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationService = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const admin = { id: 'admin-1', role: 'ADMIN' } as any;
  const nonAdmin = { id: 'user-1', role: 'CLIENT' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRefundsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AdminRefundsService>(AdminRefundsService);
  });

  describe('getRefundRequests', () => {
    it('rejects non-admins', async () => {
      await expect(service.getRefundRequests(nonAdmin)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('processRefundRequest - reject', () => {
    it('rejects non-admins', async () => {
      await expect(
        service.processRefundRequest(nonAdmin, 'req-1', { action: 'reject' } as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('404s on a missing request', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.processRefundRequest(admin, 'req-1', { action: 'reject' } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects processing an already-processed request', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'APPROVED',
      });

      await expect(
        service.processRefundRequest(admin, 'req-1', { action: 'reject' } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('marks the request REJECTED without touching the wallet', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        requestedBy: 'user-1',
      });
      mockPrismaService.refundRequest.update.mockResolvedValue({ id: 'req-1', status: 'REJECTED' });

      await service.processRefundRequest(admin, 'req-1', {
        action: 'reject',
        adminNote: 'not eligible',
      } as any);

      expect(mockPrismaService.refundRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'REJECTED' }) })
      );
      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });
  });

  describe('processRefundRequest - approve', () => {
    it('throws when there is no admin-provided amount and no default to fall back to (a full-refund request with a null amount)', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        requestedBy: 'user-1',
        amount: null,
      });

      await expect(
        service.processRefundRequest(admin, 'req-1', { action: 'approve' } as any)
      ).rejects.toThrow(BadRequestException);
      expect(mockWalletService.depositFunds).not.toHaveBeenCalled();
    });

    // The core regression test: request.amount arrives from Prisma as a real
    // Decimal instance (not a plain number) now that the schema migration
    // has landed. Before the fix, `request.amount.toLocaleString()` further
    // down would throw -- Prisma.Decimal has no such method.
    it('falls back to request.amount (a real Decimal instance) and normalizes it to a number end-to-end', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        requestedBy: 'user-1',
        amount: new Prisma.Decimal('7500.00'),
      });
      mockPrismaService.refundRequest.update.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });

      await service.processRefundRequest(admin, 'req-1', { action: 'approve' } as any);

      expect(mockWalletService.depositFunds).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ amount: 7500 }),
        undefined,
        'refund-req-1'
      );
      expect(typeof mockWalletService.depositFunds.mock.calls[0][1].amount).toBe('number');

      expect(mockPrismaService.refundRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ approvedAmount: 7500 }) })
      );

      // The notification message interpolates approvedAmount.toLocaleString() --
      // this must not throw for a Decimal-derived amount.
      const notification = mockNotificationService.createNotification.mock.calls[0][0];
      expect(notification.message).toContain('7,500');
    });

    it('prefers dto.approvedAmount (an admin override) over request.amount when both are present', async () => {
      mockPrismaService.refundRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        requestedBy: 'user-1',
        amount: new Prisma.Decimal('10000.00'),
      });
      mockPrismaService.refundRequest.update.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });

      await service.processRefundRequest(admin, 'req-1', {
        action: 'approve',
        approvedAmount: 6000,
      } as any);

      expect(mockWalletService.depositFunds).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ amount: 6000 }),
        undefined,
        'refund-req-1'
      );
    });
  });
});
