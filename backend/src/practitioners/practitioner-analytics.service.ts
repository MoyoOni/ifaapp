import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PractitionerAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(babalawoId: string) {
    // Get basic stats
    const [
      totalSessions,
      totalClients,
      avgRating,
      repeatClientRate,
      mostPopularService,
      busiestDayOfWeek,
      busiestTimeOfDay,
      monthlySessions,
      serviceOfferings,
      avgRatingOverTime,
      incomeOverTime,
      guidancePlanStats,
    ] = await Promise.all([
      // Total sessions
      this.prisma.appointment.count({
        where: {
          babalawoId,
          status: 'COMPLETED',
        },
      }),

      // Total unique clients - Fixed to use distinct properly
      this.prisma.appointment
        .aggregate({
          where: {
            babalawoId,
            status: 'COMPLETED',
          },
          _count: {
            clientId: true,
          },
        })
        .then((result) => {
          // To get unique clients, we need a separate query
          return this.prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "clientId")::int AS count
          FROM "Appointment"
          WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
        `.then((res) => Number(res[0].count));
        }),

      // Average rating
      this.prisma.babalawoReview
        .aggregate({
          where: { babalawoId },
          _avg: { rating: true },
        })
        .then((result: any) => result._avg.rating),

      // Repeat client rate
      this.calculateRepeatClientRate(babalawoId),

      // Most popular service offering
      this.getMostPopularService(babalawoId),

      // Busiest day of week
      this.getBusiestDayOfWeek(babalawoId),

      // Busiest time of day
      this.getBusiestTimeOfDay(babalawoId),

      // Monthly sessions for last 6 months
      this.getMonthlySessions(babalawoId),

      // Service offerings data
      this.getServiceOfferingsStats(babalawoId),

      // Average rating per month over last 6 months
      this.getRatingOverTime(babalawoId),

      // Monthly income over last 6 months
      this.getIncomeOverTime(babalawoId),

      // Guidance plan completion stats
      this.getGuidancePlanStats(babalawoId),
    ]);

    return {
      totalSessions,
      totalClients,
      avgRating: avgRating || 0,
      repeatClientRate: repeatClientRate || 0,
      mostPopularService: mostPopularService || 'Not available',
      busiestDayOfWeek: busiestDayOfWeek || 'Not available',
      busiestTimeOfDay: busiestTimeOfDay || 'Not available',
      monthlySessions,
      serviceOfferings,
      avgRatingOverTime,
      incomeOverTime,
      guidancePlanStats,
      memberSince: await this.getBabalawoJoinDate(babalawoId),
    };
  }

  private async getRatingOverTime(
    babalawoId: string
  ): Promise<Array<{ month: string; rating: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const rows = await this.prisma.$queryRaw<Array<{ month: number; year: number; avg: number }>>`
      SELECT
        EXTRACT(MONTH FROM "createdAt") AS month,
        EXTRACT(YEAR FROM "createdAt") AS year,
        AVG(rating)::float AS avg
      FROM "BabalawoReview"
      WHERE "babalawoId" = ${babalawoId}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
      ORDER BY year, month
    `;

    return rows.map((r) => ({
      month: `${r.year}-${String(r.month).padStart(2, '0')}`,
      rating: Math.round(r.avg * 10) / 10,
    }));
  }

  private async calculateRepeatClientRate(babalawoId: string): Promise<number> {
    const clientsWithSessionCounts = await this.prisma.$queryRaw<any[]>`
      SELECT "clientId", COUNT(*) as "sessionCount"
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
      GROUP BY "clientId"
    `;

    const totalClients = clientsWithSessionCounts.length;
    const repeatClients = clientsWithSessionCounts.filter((c: any) => c.sessionCount > 1).length;

    return totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;
  }

  private async getMostPopularService(babalawoId: string): Promise<string> {
    const serviceCounts = await this.prisma.$queryRaw<any[]>`
      SELECT service, COUNT(*) as count
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
      GROUP BY service
      ORDER BY count DESC
      LIMIT 1
    `;

    return serviceCounts[0]?.service || null;
  }

  private async getBusiestDayOfWeek(babalawoId: string): Promise<string> {
    const dayCounts = await this.prisma.$queryRaw<any[]>`
      SELECT EXTRACT(DOW FROM date) as "dayOfWeek", COUNT(*) as count
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY count DESC
      LIMIT 1
    `;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = dayCounts[0]?.dayOfWeek;

    return dayIndex !== undefined ? days[dayIndex] : 'Not available';
  }

  private async getBusiestTimeOfDay(babalawoId: string): Promise<string> {
    const hourCounts = await this.prisma.$queryRaw<any[]>`
      SELECT EXTRACT(HOUR FROM time::TIME) as hour, COUNT(*) as count
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
      GROUP BY EXTRACT(HOUR FROM time::TIME)
      ORDER BY count DESC
      LIMIT 1
    `;

    const hour = hourCounts[0]?.hour;
    if (hour === undefined) return 'Not available';

    // Convert to readable format
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  }

  private async getMonthlySessions(babalawoId: string) {
    // Get the last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        COUNT(*) as count
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} 
        AND status = 'COMPLETED' 
        AND date >= ${sixMonthsAgo}::date
      GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
      ORDER BY year, month
    `;

    // Format the data for charts
    return monthlyData.map((row: any) => ({
      month: `${row.year}-${String(row.month).padStart(2, '0')}`,
      sessions: Number(row.count),
    }));
  }

  private async getServiceOfferingsStats(babalawoId: string) {
    const serviceCounts = await this.prisma.$queryRaw<any[]>`
      SELECT service, COUNT(*) as count
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId} AND status = 'COMPLETED'
      GROUP BY service
      ORDER BY count DESC
    `;

    return serviceCounts.map((row: any) => ({
      service: row.service,
      count: Number(row.count),
    }));
  }

  private async getBabalawoJoinDate(babalawoId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: babalawoId },
      select: { createdAt: true },
    });

    return user?.createdAt;
  }

  private async getIncomeOverTime(
    babalawoId: string
  ): Promise<Array<{ month: string; income: number }>> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const rows = await this.prisma.$queryRaw<Array<{ month: number; year: number; total: number }>>`
      SELECT
        EXTRACT(MONTH FROM date) AS month,
        EXTRACT(YEAR FROM date) AS year,
        COALESCE(SUM(price), 0)::float AS total
      FROM "Appointment"
      WHERE "babalawoId" = ${babalawoId}
        AND status = 'COMPLETED'
        AND date >= ${sixMonthsAgo}::date
        AND price IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year, month
    `;

    return rows.map((r) => ({
      month: `${r.year}-${String(r.month).padStart(2, '0')}`,
      income: Math.round(r.total),
    }));
  }

  private async getGuidancePlanStats(babalawoId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    avgItemsCompleted: number;
  }> {
    const plans = (await this.prisma.guidancePlan.findMany({
      where: { babalawoId },
      select: { status: true, items: true, completedItems: true },
    })) as Array<{ status: string; items: unknown; completedItems: string[] }>;

    const total = plans.length;
    const completed = plans.filter((p) => p.status === 'COMPLETED').length;
    const inProgress = plans.filter((p) => p.status === 'IN_PROGRESS').length;

    const avgItemsCompleted =
      total > 0
        ? (plans.reduce((acc, p) => {
            const itemCount = Array.isArray(p.items) ? (p.items as unknown[]).length : 0;
            const doneCount = Array.isArray(p.completedItems) ? p.completedItems.length : 0;
            return acc + (itemCount > 0 ? doneCount / itemCount : 0);
          }, 0) /
            total) *
          100
        : 0;

    return {
      total,
      completed,
      inProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgItemsCompleted: Math.round(avgItemsCompleted),
    };
  }
}
