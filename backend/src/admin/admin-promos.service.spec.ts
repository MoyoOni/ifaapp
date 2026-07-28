import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminPromosService } from './admin-promos.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

// ProBacklog-v1.md structural fix: deletePromo() used to call
// prisma.promoCode.delete() with no check at all. PromoRedemption.promoCode
// is onDelete:Cascade, so deleting a promo code that had ever been redeemed
// silently destroyed the record of every order that used it. No test
// coverage existed for this service at all before this fix.
describe('AdminPromosService', () => {
  let service: AdminPromosService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', verified: true } as any;

  const mockPrismaService = {
    promoCode: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPromosService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminPromosService>(AdminPromosService);
  });

  describe('deletePromo', () => {
    it('404s on a missing promo code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.deletePromo('missing', mockAdmin)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.promoCode.delete).not.toHaveBeenCalled();
    });

    it('deletes a promo code that has never been redeemed', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        id: 'promo-1',
        _count: { redemptions: 0 },
      });
      mockPrismaService.promoCode.delete.mockResolvedValue({ id: 'promo-1' });

      await service.deletePromo('promo-1', mockAdmin);

      expect(mockPrismaService.promoCode.delete).toHaveBeenCalledWith({ where: { id: 'promo-1' } });
    });

    it('rejects deleting a promo code that has redemption history, instead of cascading it away', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        id: 'promo-1',
        _count: { redemptions: 5 },
      });

      await expect(service.deletePromo('promo-1', mockAdmin)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.promoCode.delete).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    // P0-03: real queryable audit trail for hard deletes.
    it('logs the deletion to AuditLog with a snapshot of the deleted row', async () => {
      const promo = { id: 'promo-1', code: 'WELCOME10', _count: { redemptions: 0 } };
      mockPrismaService.promoCode.findUnique.mockResolvedValue(promo);
      mockPrismaService.promoCode.delete.mockResolvedValue(promo);

      await service.deletePromo('promo-1', mockAdmin);

      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'PromoCode',
          entityId: 'promo-1',
          payload: { snapshot: promo },
        })
      );
    });
  });
});
