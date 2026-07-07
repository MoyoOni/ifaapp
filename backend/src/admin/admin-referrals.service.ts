import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminReferralsService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const total = await this.prisma.referral.count();
    const rewarded = await this.prisma.referral.count({ where: { rewardGranted: true } });
    const conversionRate = total > 0 ? (rewarded / total) * 100 : 0;

    // Leaderboard: top referrers by referral count
    const leaderboardRaw = await this.prisma.$queryRaw<Array<{ referrerId: string; count: number }>>`
      SELECT "referrerId", COUNT(*) as count
      FROM referrals
      GROUP BY "referrerId"
      ORDER BY count DESC
      LIMIT 10
    `;

    // Fetch user details for leaderboard
    const userIds = leaderboardRaw.map((l) => l.referrerId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = leaderboardRaw.map((l) => ({
      user: userMap.get(l.referrerId) || null,
      count: l.count,
    }));

    return {
      total,
      converted: rewarded,
      rewarded,
      conversionRate: Math.round(conversionRate * 100) / 100,
      leaderboard,
    };
  }

  async getReferrals(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { id: true, name: true, email: true } },
          referred: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.referral.count(),
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async creditReferral(id: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      include: { referrer: true },
    });
    
    if (!referral) {
      throw new Error('Referral not found');
    }
    
    if (referral.rewardGranted) {
      throw new Error('Reward already granted');
    }

    // Update the referral to mark as rewarded
    // Based on existing implementations in appointments and subscriptions services,
    // the actual reward (wallet deposit or subscription upgrade) would typically happen here
    return this.prisma.referral.update({
      where: { id },
      data: { rewardGranted: true },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referred: { select: { id: true, name: true, email: true } },
      },
    });
  }
}