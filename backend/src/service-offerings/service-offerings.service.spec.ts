import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServiceOfferingsService } from './service-offerings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ServiceOfferingsService', () => {
  let service: ServiceOfferingsService;

  const mockPrismaService = {
    serviceOffering: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const babalawoUser = { id: 'baba-1', sub: 'baba-1', email: 'b@example.com', role: 'BABALAWO' as any, verified: true };
  const otherBabalawoUser = { id: 'baba-2', sub: 'baba-2', email: 'b2@example.com', role: 'BABALAWO' as any, verified: true };
  const adminUser = { id: 'admin-1', sub: 'admin-1', email: 'a@example.com', role: 'ADMIN' as any, verified: true };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceOfferingsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ServiceOfferingsService>(ServiceOfferingsService);
    jest.clearAllMocks();
  });

  describe('getForBabalawo', () => {
    it('returns offerings for the given babalawo ordered by createdAt', async () => {
      mockPrismaService.serviceOffering.findMany.mockResolvedValue([{ id: 'so-1' }]);

      const result = await service.getForBabalawo('baba-1');

      expect(mockPrismaService.serviceOffering.findMany).toHaveBeenCalledWith({
        where: { babalawoId: 'baba-1', deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual([{ id: 'so-1' }]);
    });
  });

  describe('create', () => {
    const dto = { name: 'Consultation', description: 'desc', category: 'Consultation', durationMinutes: 60, priceAmount: 15000 };

    it('creates an offering for the owning babalawo', async () => {
      mockPrismaService.serviceOffering.create.mockResolvedValue({ id: 'so-1', babalawoId: 'baba-1', ...dto });

      const result = await service.create('baba-1', dto as any, babalawoUser);

      expect(mockPrismaService.serviceOffering.create).toHaveBeenCalledWith({
        data: { babalawoId: 'baba-1', ...dto },
      });
      expect(result.id).toBe('so-1');
    });

    it('allows an admin to create on behalf of any babalawo', async () => {
      mockPrismaService.serviceOffering.create.mockResolvedValue({ id: 'so-1' });

      await expect(service.create('baba-1', dto as any, adminUser)).resolves.toBeDefined();
    });

    it('rejects a different babalawo creating on someone else\'s catalog', async () => {
      await expect(service.create('baba-1', dto as any, otherBabalawoUser)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.serviceOffering.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates when the offering belongs to the owning babalawo', async () => {
      mockPrismaService.serviceOffering.findUnique.mockResolvedValue({ id: 'so-1', babalawoId: 'baba-1' });
      mockPrismaService.serviceOffering.update.mockResolvedValue({ id: 'so-1', name: 'Updated' });

      const result = await service.update('baba-1', 'so-1', { name: 'Updated' }, babalawoUser);

      expect(result.name).toBe('Updated');
    });

    it('rejects a different babalawo updating', async () => {
      await expect(service.update('baba-1', 'so-1', { name: 'Updated' }, otherBabalawoUser)).rejects.toThrow(
        ForbiddenException
      );
      expect(mockPrismaService.serviceOffering.findUnique).not.toHaveBeenCalled();
    });

    it('404s when the offering does not belong to the given babalawoId', async () => {
      mockPrismaService.serviceOffering.findUnique.mockResolvedValue({ id: 'so-1', babalawoId: 'someone-else' });

      await expect(service.update('baba-1', 'so-1', { name: 'Updated' }, babalawoUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('404s when the offering does not exist', async () => {
      mockPrismaService.serviceOffering.findUnique.mockResolvedValue(null);

      await expect(service.update('baba-1', 'so-1', { name: 'Updated' }, babalawoUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove (ProBacklog-v1.md item #12: soft-delete audit)', () => {
    it('soft-deletes by setting deletedAt instead of calling prisma delete', async () => {
      mockPrismaService.serviceOffering.findUnique.mockResolvedValue({ id: 'so-1', babalawoId: 'baba-1' });
      mockPrismaService.serviceOffering.update.mockResolvedValue({ id: 'so-1' });

      const result = await service.remove('baba-1', 'so-1', babalawoUser);

      expect(mockPrismaService.serviceOffering.update).toHaveBeenCalledWith({
        where: { id: 'so-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.serviceOffering.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('rejects a different babalawo deleting', async () => {
      await expect(service.remove('baba-1', 'so-1', otherBabalawoUser)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.serviceOffering.update).not.toHaveBeenCalled();
    });

    it('excludes already-deleted offerings from the lookup (idempotent 404, not a re-timestamp)', async () => {
      mockPrismaService.serviceOffering.findUnique.mockResolvedValue(null);

      await expect(service.remove('baba-1', 'so-1', babalawoUser)).rejects.toThrow(NotFoundException);
      const call = mockPrismaService.serviceOffering.findUnique.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });
  });
});
