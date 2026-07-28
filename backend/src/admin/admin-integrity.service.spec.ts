import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminIntegrityService } from './admin-integrity.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

// P0-03: deleteRule() had zero test coverage and never logged its
// deletions anywhere queryable before this fix.
describe('AdminIntegrityService', () => {
  let service: AdminIntegrityService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', verified: true } as any;

  const mockPrismaService = {
    contentFlagRule: {
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
        AdminIntegrityService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminIntegrityService>(AdminIntegrityService);
  });

  describe('deleteRule', () => {
    it('404s on a missing flag rule', async () => {
      mockPrismaService.contentFlagRule.findUnique.mockResolvedValue(null);

      await expect(service.deleteRule('missing', mockAdmin)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.contentFlagRule.delete).not.toHaveBeenCalled();
    });

    it('deletes the rule and logs it to AuditLog with a snapshot', async () => {
      const rule = { id: 'rule-1', keyword: 'akose' };
      mockPrismaService.contentFlagRule.findUnique.mockResolvedValue(rule);
      mockPrismaService.contentFlagRule.delete.mockResolvedValue(rule);

      const result = await service.deleteRule('rule-1', mockAdmin);

      expect(mockPrismaService.contentFlagRule.delete).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
      expect(result).toEqual(rule);
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'ContentFlagRule',
          entityId: 'rule-1',
          payload: { snapshot: rule },
        })
      );
    });
  });
});
