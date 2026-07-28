import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

interface ResolvableItem {
  createdAt: Date;
  resolvedAt: Date | null;
  status: string;
}

// Whole-app audit loose end: the Quality Assurance admin tab used to show
// 100% hardcoded numbers (98.4% SLA compliance, 4.8/5.0 satisfaction, etc)
// with zero backend behind any of them. This computes real equivalents from
// data that already exists (Disputes, PractitionerComplaints, UserReports,
// BabalawoReview) instead of inventing different fake ones. "48h SLA" is a
// threshold chosen for this report, not an existing documented policy --
// labelled accordingly rather than implying an official commitment.
@Injectable()
export class AdminQualityMetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view quality metrics');
    }

    const [disputes, complaints, reports, ratingAgg] = await Promise.all([
      this.prisma.dispute.findMany({ select: { createdAt: true, resolvedAt: true, status: true } }),
      this.prisma.practitionerComplaint.findMany({
        select: { createdAt: true, resolvedAt: true, status: true },
      }),
      this.prisma.userReport.findMany({ select: { createdAt: true, resolvedAt: true, status: true } }),
      this.prisma.babalawoReview.aggregate({ _avg: { rating: true }, _count: { id: true } }),
    ]);

    const allItems: ResolvableItem[] = [...disputes, ...complaints, ...reports];
    const resolved = allItems.filter((i) => i.resolvedAt !== null);
    const pending = allItems.filter((i) => i.resolvedAt === null);

    const resolutionHours = resolved.map(
      (i) => (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60)
    );
    const avgResolutionHours =
      resolutionHours.length > 0
        ? resolutionHours.reduce((sum, h) => sum + h, 0) / resolutionHours.length
        : null;

    const SLA_HOURS = 48;
    const withinSla = resolutionHours.filter((h) => h <= SLA_HOURS).length;
    const withinSlaPercent =
      resolutionHours.length > 0 ? (withinSla / resolutionHours.length) * 100 : null;

    return {
      openReviewItems: pending.length,
      resolvedReviewItems: resolved.length,
      avgResolutionHours,
      slaThresholdHours: SLA_HOURS,
      resolvedWithinSlaPercent: withinSlaPercent,
      averagePractitionerRating: ratingAgg._avg.rating,
      totalReviewsCounted: ratingAgg._count.id,
    };
  }
}
