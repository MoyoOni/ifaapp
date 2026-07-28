import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminCampaignsService } from './admin-campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { SesEmailService } from '../shared/services/ses-email.service';
import { AuditService } from './audit.service';

// P0-03: deleteCampaign() already guarded against deleting a SENT campaign,
// but had zero test coverage and never logged its deletions anywhere
// queryable before this fix.
describe('AdminCampaignsService', () => {
  let service: AdminCampaignsService;

  const mockAdmin = { id: 'admin-1', role: 'ADMIN', email: 'admin@example.com', verified: true } as any;

  const mockPrismaService = {
    emailCampaign: {
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
        AdminCampaignsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SesEmailService, useValue: {} },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AdminCampaignsService>(AdminCampaignsService);
  });

  describe('deleteCampaign', () => {
    it('404s on a missing campaign', async () => {
      mockPrismaService.emailCampaign.findUnique.mockResolvedValue(null);

      await expect(service.deleteCampaign('missing', mockAdmin)).rejects.toThrow(NotFoundException);
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('rejects deleting a campaign that has already been sent', async () => {
      mockPrismaService.emailCampaign.findUnique.mockResolvedValue({ id: 'campaign-1', status: 'SENT' });

      await expect(service.deleteCampaign('campaign-1', mockAdmin)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.emailCampaign.delete).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('deletes a draft campaign and logs it to AuditLog with a snapshot', async () => {
      const campaign = { id: 'campaign-1', status: 'DRAFT', subject: 'Welcome' };
      mockPrismaService.emailCampaign.findUnique.mockResolvedValue(campaign);
      mockPrismaService.emailCampaign.delete.mockResolvedValue(campaign);

      await service.deleteCampaign('campaign-1', mockAdmin);

      expect(mockPrismaService.emailCampaign.delete).toHaveBeenCalledWith({ where: { id: 'campaign-1' } });
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: 'admin-1',
          action: 'DELETE',
          entityType: 'EmailCampaign',
          entityId: 'campaign-1',
          payload: { snapshot: campaign },
        })
      );
    });
  });
});
