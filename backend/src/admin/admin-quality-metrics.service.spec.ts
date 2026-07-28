import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { AdminQualityMetricsService } from './admin-quality-metrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminQualityMetricsService', () => {
  let service: AdminQualityMetricsService;

  const mockPrismaService = {
    dispute: { findMany: jest.fn().mockResolvedValue([]) },
    practitionerComplaint: { findMany: jest.fn().mockResolvedValue([]) },
    userReport: { findMany: jest.fn().mockResolvedValue([]) },
    babalawoReview: {
      aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { id: 0 } }),
    },
  };

  const admin = { id: 'admin-1', role: 'ADMIN' } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.dispute.findMany.mockResolvedValue([]);
    mockPrismaService.practitionerComplaint.findMany.mockResolvedValue([]);
    mockPrismaService.userReport.findMany.mockResolvedValue([]);
    mockPrismaService.babalawoReview.aggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { id: 0 },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminQualityMetricsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<AdminQualityMetricsService>(AdminQualityMetricsService);
  });

  it('rejects non-admins', async () => {
    await expect(service.getMetrics({ id: 'x', role: 'CLIENT' } as any)).rejects.toThrow(
      ForbiddenException
    );
  });

  it('returns null resolution stats when nothing has ever been resolved', async () => {
    mockPrismaService.dispute.findMany.mockResolvedValue([
      { createdAt: new Date(), resolvedAt: null, status: 'OPEN' },
    ]);

    const result = await service.getMetrics(admin);

    expect(result.avgResolutionHours).toBeNull();
    expect(result.resolvedWithinSlaPercent).toBeNull();
    expect(result.openReviewItems).toBe(1);
    expect(result.resolvedReviewItems).toBe(0);
  });

  it('computes average resolution time across disputes, complaints, and reports combined', async () => {
    const base = new Date('2026-01-01T00:00:00Z');
    mockPrismaService.dispute.findMany.mockResolvedValue([
      { createdAt: base, resolvedAt: new Date('2026-01-01T10:00:00Z'), status: 'RESOLVED' }, // 10h
    ]);
    mockPrismaService.practitionerComplaint.findMany.mockResolvedValue([
      { createdAt: base, resolvedAt: new Date('2026-01-03T00:00:00Z'), status: 'RESOLVED' }, // 48h
    ]);
    mockPrismaService.userReport.findMany.mockResolvedValue([
      { createdAt: base, resolvedAt: new Date('2026-01-05T00:00:00Z'), status: 'RESOLVED' }, // 96h
    ]);

    const result = await service.getMetrics(admin);

    expect(result.resolvedReviewItems).toBe(3);
    expect(result.avgResolutionHours).toBeCloseTo((10 + 48 + 96) / 3, 5);
    // Two of three resolved within the 48h threshold
    expect(result.resolvedWithinSlaPercent).toBeCloseTo((2 / 3) * 100, 5);
  });

  it('surfaces the average practitioner rating from BabalawoReview', async () => {
    mockPrismaService.babalawoReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.6 },
      _count: { id: 42 },
    });

    const result = await service.getMetrics(admin);

    expect(result.averagePractitionerRating).toBe(4.6);
    expect(result.totalReviewsCounted).toBe(42);
  });
});
