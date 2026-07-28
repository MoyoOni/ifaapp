import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminPromosService } from './admin-promos.service';
import { PrismaService } from '../prisma/prisma.service';

// ProBacklog-v1.md structural fix: deletePromo() used to call
// prisma.promoCode.delete() with no check at all. PromoRedemption.promoCode
// is onDelete:Cascade, so deleting a promo code that had ever been redeemed
// silently destroyed the record of every order that used it. No test
// coverage existed for this service at all before this fix.
describe('AdminPromosService', () => {
  let service: AdminPromosService;

  const mockPrismaService = {
    promoCode: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminPromosService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AdminPromosService>(AdminPromosService);
  });

  describe('deletePromo', () => {
    it('404s on a missing promo code', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.deletePromo('missing')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.promoCode.delete).not.toHaveBeenCalled();
    });

    it('deletes a promo code that has never been redeemed', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        id: 'promo-1',
        _count: { redemptions: 0 },
      });
      mockPrismaService.promoCode.delete.mockResolvedValue({ id: 'promo-1' });

      await service.deletePromo('promo-1');

      expect(mockPrismaService.promoCode.delete).toHaveBeenCalledWith({ where: { id: 'promo-1' } });
    });

    it('rejects deleting a promo code that has redemption history, instead of cascading it away', async () => {
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        id: 'promo-1',
        _count: { redemptions: 5 },
      });

      await expect(service.deletePromo('promo-1')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.promoCode.delete).not.toHaveBeenCalled();
    });
  });
});
