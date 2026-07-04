import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrackEventDto {
  event: string;
  userId?: string;
  role?: string;
  data?: Record<string, unknown>;
}

const ONBOARDING_STEPS = [
  'welcome',
  'intent',
  'preferences',
  'heritage',
  'role-setup',
  'username',
  'credentials',
  'discover-temples',
  'form',
  'avatar',
  'complete',
];

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(dto: TrackEventDto) {
    await this.prisma.analyticsEvent.create({
      data: {
        event: dto.event,
        userId: dto.userId ?? null,
        role: dto.role ?? null,
        data: (dto.data as object) ?? undefined,
      },
    });
  }

  async getOnboardingFunnel(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: {
        event: { startsWith: 'onboarding_' },
        createdAt: { gte: since },
      },
      _count: { event: true },
    });

    // Map step events to ordered funnel
    const stepCounts: Record<string, number> = {};
    for (const e of events) {
      const step = e.event.replace('onboarding_', '');
      stepCounts[step] = e._count.event;
    }

    return ONBOARDING_STEPS.map((step) => ({
      step,
      count: stepCounts[step] ?? 0,
    }));
  }
}
