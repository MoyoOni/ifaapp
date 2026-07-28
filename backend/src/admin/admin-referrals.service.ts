import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService, NotificationType, NotificationCategory } from '../notifications/notification.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class AdminReferralsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService
  ) {}

  async getStats() {
    const total = await this.prisma.referral.count();
    const rewarded = await this.prisma.referral.count({ where: { rewardGranted: true } });
    const conversionRate = total > 0 ? (rewarded / total) * 100 : 0;

    // Leaderboard: top referrers by referral count
    const leaderboardRaw = await this.prisma.$queryRaw<
      Array<{ referrerId: string; count: number }>
    >`
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

  /**
   * VENDOR_BACKLOG.md VND-021 / ILUASE_V1_BACKLOG.md fix: this used to just
   * flip `rewardGranted: true` with no money moving at all -- its own old
   * comment said "the actual reward... would typically happen here." Now it
   * actually pays the same EXP-027 ₦500-to-both-parties reward
   * `appointments.service.ts`'s `maybeGrantReferralReward()` pays
   * automatically on a referred user's first completed booking. This admin
   * action exists specifically because that automatic trigger can never fire
   * right now -- Consultations (bookings) are paused platform-wide -- so
   * admins need a manual way to honor a legitimate referral in the meantime.
   * Uses the exact same `AppointmentsService.REFERRAL_REWARD_NGN` constant
   * so the two paths can never pay different amounts.
   */
  async creditReferral(id: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      include: { referrer: true },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.rewardGranted) {
      throw new BadRequestException('Reward already granted');
    }

    const rewardNgn = AppointmentsService.REFERRAL_REWARD_NGN;
    const rewardDto = {
      amount: rewardNgn,
      currency: 'NGN' as any,
      reference: `referral_reward_admin_${referral.id}`,
    };
    await this.walletService.depositFunds(referral.referrerId, rewardDto);
    await this.walletService.depositFunds(referral.referredId, {
      ...rewardDto,
      reference: `referral_welcome_admin_${referral.id}`,
    });

    const updated = await this.prisma.referral.update({
      where: { id },
      data: { rewardGranted: true },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referred: { select: { id: true, name: true, email: true } },
      },
    });

    await this.notificationService.createNotification({
      userId: referral.referrerId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: '🎉 Referral reward earned!',
      message: `₦${rewardNgn} has been added to your wallet for your referral.`,
      data: { action: 'referral_reward', amount: rewardNgn },
      sendEmail: false,
      sendPush: false,
    });
    await this.notificationService.createNotification({
      userId: referral.referredId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: '🎉 Welcome bonus earned!',
      message: `₦${rewardNgn} has been added to your wallet as a welcome gift from your referral.`,
      data: { action: 'referral_reward', amount: rewardNgn },
      sendEmail: false,
      sendPush: false,
    });

    return updated;
  }
}
