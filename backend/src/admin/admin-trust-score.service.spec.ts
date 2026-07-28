import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminTrustScoreService } from './admin-trust-score.service';
import { PrismaService } from '../prisma/prisma.service';

// Scoped to SHOP_BACKLOG.md MSP-006's fix: getTrustScoreAudit's breakdown was
// hardcoded babalawo-shaped (appointments/reviews/forum activity), so a
// vendor's trust-score review showed all-zero/irrelevant data with no real
// conduct signals (disputes, fulfillment) to base an override/restoration
// decision on. Not full coverage of this service's practitioner-featuring
// methods, which are unrelated to this fix.
describe('AdminTrustScoreService - vendor-aware breakdown (MSP-006)', () => {
  let service: AdminTrustScoreService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    auditLog: { findMany: jest.fn(), create: jest.fn() },
    vendor: { findUnique: jest.fn() },
    appointment: { count: jest.fn() },
    babalawoReview: { aggregate: jest.fn() },
    forumPost: { count: jest.fn() },
    forumThread: { count: jest.fn() },
    referral: { count: jest.fn() },
    certificate: { count: jest.fn() },
    productReview: { aggregate: jest.fn() },
    dispute: { findMany: jest.fn() },
    returnRequest: { count: jest.fn() },
    order: { count: jest.fn() },
    elderEndorsement: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.auditLog.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminTrustScoreService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AdminTrustScoreService>(AdminTrustScoreService);
  });

  it('404s on a missing user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.getTrustScoreAudit('user-1')).rejects.toThrow(NotFoundException);
  });

  it('uses the practitioner-shaped breakdown for a non-vendor user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'BABALAWO' });
    mockPrismaService.vendor.findUnique.mockResolvedValue(null);
    mockPrismaService.appointment.count.mockResolvedValue(4);
    mockPrismaService.babalawoReview.aggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { id: 10 } });
    mockPrismaService.forumPost.count.mockResolvedValue(2);
    mockPrismaService.forumThread.count.mockResolvedValue(1);
    mockPrismaService.referral.count.mockResolvedValue(0);
    mockPrismaService.certificate.count.mockResolvedValue(1);

    const result = await service.getTrustScoreAudit('user-1');

    expect(result.breakdown.map((b) => b.component)).toContain('Completed consultations');
    expect(result.breakdown.map((b) => b.component)).not.toContain('Order disputes (resolved / total)');
    expect(mockPrismaService.productReview.aggregate).not.toHaveBeenCalled();
  });

  it('uses the vendor-shaped breakdown -- including real dispute resolution history -- for a vendor user', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'VENDOR' });
    mockPrismaService.vendor.findUnique.mockResolvedValue({ id: 'vendor-1', userId: 'user-1' });
    mockPrismaService.productReview.aggregate.mockResolvedValue({ _avg: { rating: 4.2 }, _count: { id: 8 } });
    mockPrismaService.dispute.findMany.mockResolvedValue([
      { status: 'RESOLVED' },
      { status: 'RESOLVED' },
      { status: 'OPEN' },
    ]);
    mockPrismaService.returnRequest.count.mockResolvedValue(3);
    mockPrismaService.order.count.mockResolvedValue(20);
    mockPrismaService.elderEndorsement.count.mockResolvedValue(1);

    const result = await service.getTrustScoreAudit('user-1');

    expect(mockPrismaService.appointment.count).not.toHaveBeenCalled();
    const disputeRow = result.breakdown.find((b) => b.component === 'Order disputes (resolved / total)');
    expect(disputeRow?.value).toBe('2/3');
    expect(mockPrismaService.dispute.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { respondentId: 'user-1', orderId: { not: null } } })
    );
  });

  describe('applyOverride', () => {
    it('applies an override for a vendor user id exactly the same as any other -- generic by design', async () => {
      mockPrismaService.user.update = jest.fn().mockResolvedValue({});

      await service.applyOverride('vendor-user-1', 75, 'Restoring trust after resolved dispute', 'admin-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'vendor-user-1' },
        data: {
          trustScoreOverride: 75,
          trustScoreOverrideReason: 'Restoring trust after resolved dispute',
          trustScoreOverrideBy: 'admin-1',
          trustScoreOverrideAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'TRUST_SCORE_OVERRIDE', resourceId: 'vendor-user-1' }),
        })
      );
    });
  });
});
