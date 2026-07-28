import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../shared/types/current-user-payload.interface';
import { AdminFinanceService } from './admin-finance.service';
import { AdminIntegrityService } from './admin-integrity.service';
import { AdminComplaintsService } from './admin-complaints.service';

@Injectable()
export class AdminMorningBriefService {
  constructor(
    private prisma: PrismaService,
    private financeService: AdminFinanceService,
    private integrityService: AdminIntegrityService,
    private complaintsService: AdminComplaintsService
  ) {}

  async getMorningBrief(admin: CurrentUserPayload) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // ---- Signups ----
    const [todaySignups, yesterdaySignups] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today.toISOString() } } }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: yesterday.toISOString(), lt: today.toISOString() },
        },
      }),
    ]);
    const trend =
      yesterdaySignups > 0 ? (todaySignups - yesterdaySignups) / yesterdaySignups : null;

    // ---- Pending Actions ----
    // Reuse existing methods
    const [verifications, withdrawals, reports, disputes] = await Promise.all([
      // Same "pending" definition admin.service.ts's getPlatformStats already uses:
      // any stage short of the final ETHICS_AGREEMENT stage.
      this.prisma.verificationApplication.count({
        where: { currentStage: { not: 'ETHICS_AGREEMENT' } },
      }),
      this.financeService.getPendingPayoutsTotal(),
      (async () => {
        const result = await this.integrityService.getQueue(1, 1);
        return typeof result.total === 'number' ? result.total : 0;
      })(),
      (async () => {
        const result = await this.complaintsService.getComplaints(admin, 'PENDING', 1, 1000);
        return Array.isArray(result) ? result.length : 0;
      })(),
    ]);

    // ---- Revenue ----
    // Reuse Financial Command Centre / Forecasting logic
    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      this.getRevenueBetween(today, new Date(now.getTime() + 86400000)),
      this.getRevenueBetween(weekAgo, now),
      this.getRevenueBetween(monthAgo, now),
    ]);

    // ---- Recent Threads ----
    const recentThreads = await this.prisma.forumThread.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        posts: {
          where: {
            AND: [{ status: 'ACTIVE' }, { reports: { some: { status: 'PENDING' } } }],
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    // ---- Platform Health ----
    // Simple health check – could be enhanced with actual DB/API health pings
    const databaseOk = await this.checkDatabaseHealth();
    const apiOk = await this.checkApiHealth();

    return {
      signups: {
        today: todaySignups,
        yesterday: yesterdaySignups,
        trend,
      },
      pendingActions: {
        verifications,
        withdrawals,
        reports,
        disputes,
        total: verifications + withdrawals + reports + disputes,
      },
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
      },
      recentThreads: recentThreads.map((t) => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt,
        author: {
          id: t.author.id,
          name: t.author.name,
          avatar: t.author.avatar,
        },
        hasReport: t.posts.length > 0,
      })),
      platformHealth: {
        database: databaseOk ? 'ok' : 'degraded',
        api: apiOk ? 'ok' : 'degraded',
      },
      generatedAt: now.toISOString(),
    };
  }

  private async getRevenueBetween(start: Date, end: Date): Promise<number> {
    // Compute revenue from appointments + orders in the date range
    const [apptAgg, orderAgg] = await Promise.all([
      this.prisma.appointment.aggregate({
        _sum: { price: true },
        where: {
          date: { gte: start.toISOString(), lt: end.toISOString() },
          status: 'COMPLETED',
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: start.toISOString(), lt: end.toISOString() },
          status: 'DELIVERED',
        },
      }),
    ]);
    const gmv = Number(apptAgg._sum?.price || 0) + Number(orderAgg._sum?.totalAmount || 0);
    return gmv * 0.1; // 10% platform fee
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkApiHealth(): Promise<boolean> {
    // This could be enhanced to check actual API responsiveness
    // For now, if we can query the DB, we assume the API is healthy
    return true;
  }
}
