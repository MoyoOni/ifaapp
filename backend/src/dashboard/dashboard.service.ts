import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { combineDateTimeInZone } from '../utils/scheduling.util';
import {
  ClientDashboardSummary,
  BabalawoDashboardSummary,
  VendorDashboardSummary,
  ConsultationSummary,
  GuidancePlanSummary,
} from './dto/dashboard-summary.dto';

/**
 * P2-03: prefer the precomputed UTC instant; only pre-migration rows that
 * couldn't be backfilled fall back to a fresh timezone-aware combination —
 * see the matching helper in appointments.service.ts.
 */
function resolveScheduledAt(apt: { date: string; time: string; timezone?: string; scheduledAt?: Date | null }): Date {
  return apt.scheduledAt ?? combineDateTimeInZone(apt.date, apt.time, apt.timezone || 'Africa/Lagos');
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard summary for a client user
   */
  async getClientSummary(userId: string): Promise<ClientDashboardSummary> {
    // Get recent consultations (last 3)
    const appointments = await this.prisma.appointment.findMany({
      where: { clientId: userId },
      orderBy: { date: 'desc' },
      take: 3,
      include: {
        babalawo: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const recentConsultations: ConsultationSummary[] = appointments.map((apt: any) => ({
      id: apt.id,
      clientId: apt.clientId,
      clientName: '',
      babalawoId: apt.babalawoId,
      babalawoName: apt.babalawo?.name || 'Unknown',
      scheduledDate: resolveScheduledAt(apt),
      duration: apt.duration,
      topic: apt.notes || '',
      status: apt.status,
      preferredMethod: 'VIDEO',
    }));

    // Get pending guidance plans
    const guidancePlans = await this.prisma.guidancePlan.findMany({
      where: {
        clientId: userId,
        status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        babalawo: {
          select: { name: true },
        },
      },
    });

    const pendingGuidancePlans: GuidancePlanSummary[] = guidancePlans.map((plan: any) => ({
      id: plan.id,
      title: plan.type || 'Guidance Plan',
      consultationId: plan.appointmentId || '',
      babalawoName: plan.babalawo?.name || 'Unknown',
      clientName: '',
      status: plan.status,
      createdAt: plan.createdAt,
      totalCost: plan.totalCost ? Number(plan.totalCost) : undefined,
    }));

    // Get temples user is a member of (through the many-to-many relation)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        templesJoined: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
          },
          take: 5,
        },
        circleMemberships: {
          where: { status: 'ACTIVE' },
          include: {
            circle: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 5,
        },
      },
    });

    // Get unread message count
    const unreadMessages = await this.prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });

    // Get wallet balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true, currency: true },
    });

    return {
      recentConsultations,
      pendingGuidancePlans,
      communities: {
        temples: (user?.templesJoined || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          location: t.location || undefined,
          memberCount: 0,
        })),
        circles: (user?.circleMemberships || []).map((m: any) => ({
          id: m.circle.id,
          name: m.circle.name,
          slug: m.circle.slug,
          memberCount: 0,
        })),
      },
      unreadMessages,
      walletBalance: {
        amount: wallet ? Number(wallet.balance) : 0,
        currency: wallet?.currency || 'NGN',
      },
    };
  }

  /**
   * Get dashboard summary for a babalawo user
   */
  async getBabalawoSummary(userId: string): Promise<BabalawoDashboardSummary> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    // Get upcoming consultations (today and future)
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        babalawoId: userId,
        date: { gte: todayStr },
        status: { in: ['UPCOMING', 'CONFIRMED', 'PENDING'] },
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        client: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const upcomingConsultations: ConsultationSummary[] = upcomingAppointments.map((apt: any) => ({
      id: apt.id,
      clientId: apt.clientId,
      clientName: apt.client?.name || 'Unknown',
      clientAvatar: apt.client?.avatar || undefined,
      babalawoId: apt.babalawoId,
      babalawoName: '',
      scheduledDate: resolveScheduledAt(apt),
      duration: apt.duration,
      topic: apt.notes || '',
      status: apt.status,
      preferredMethod: 'VIDEO',
    }));

    // Get pending guidance plans
    const pendingPlans = await this.prisma.guidancePlan.findMany({
      where: {
        babalawoId: userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    const pendingGuidancePlans: GuidancePlanSummary[] = pendingPlans.map((plan: any) => ({
      id: plan.id,
      title: plan.type || 'Guidance Plan',
      consultationId: plan.appointmentId || '',
      babalawoName: '',
      clientName: plan.client?.name || 'Unknown',
      status: plan.status,
      createdAt: plan.createdAt,
      totalCost: plan.totalCost ? Number(plan.totalCost) : undefined,
    }));

    // Get client count
    const babalawoClients = await this.prisma.babalawoClient.findMany({
      where: { babalawoId: userId },
      include: {
        client: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const activeClients = babalawoClients.map((bc: any) => ({
      id: bc.client.id,
      name: bc.client.name,
      avatar: bc.client.avatar || undefined,
      lastConsultation: bc.startDate || undefined,
      status: bc.status,
    }));

    // Get monthly earnings from completed escrows
    const monthlyEscrows = await this.prisma.escrow.findMany({
      where: {
        recipientId: userId,
        status: 'RELEASED',
        releasedAt: { gte: startOfMonth },
      },
      select: { amount: true, currency: true },
    });

    const monthlyEarnings = {
      amount: monthlyEscrows.reduce((sum: number, e: any) => sum + Number(e.amount), 0),
      currency: monthlyEscrows[0]?.currency || 'NGN',
      transactionCount: monthlyEscrows.length,
    };

    // Get analytics
    const totalConsultations = await this.prisma.appointment.count({
      where: { babalawoId: userId },
    });

    const completedThisMonth = await this.prisma.appointment.count({
      where: {
        babalawoId: userId,
        status: 'COMPLETED',
        date: { gte: startOfMonthStr },
      },
    });

    const pendingRequests = await this.prisma.appointment.count({
      where: {
        babalawoId: userId,
        status: 'UPCOMING',
      },
    });

    // Get average rating
    const reviews = await this.prisma.babalawoReview.aggregate({
      where: { babalawoId: userId },
      _avg: { rating: true },
    });

    // Get temple - using user's templesJoined relation
    const userWithTemples = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        templesJoined: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
          },
          take: 1,
        },
      },
    });

    const temple = userWithTemples?.templesJoined[0];

    return {
      upcomingConsultations,
      pendingGuidancePlans,
      clientCount: babalawoClients.length,
      activeClients: activeClients.slice(0, 5),
      monthlyEarnings,
      analytics: {
        totalConsultations,
        completedThisMonth,
        averageRating: reviews._avg.rating || 0,
        pendingRequests,
      },
      temple: temple
        ? {
            id: temple.id,
            name: temple.name,
            slug: temple.slug,
            location: temple.location || undefined,
            memberCount: 0,
          }
        : undefined,
    };
  }

  /**
   * Get detailed analytics for a babalawo over a time period
   */
  async getBabalawoAnalytics(userId: string, period: '7d' | '30d' | '90d' = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    // Consultation volume grouped by week
    const appointments = await this.prisma.appointment.findMany({
      where: {
        babalawoId: userId,
        date: { gte: sinceStr },
      },
      select: { date: true, status: true, clientId: true },
      orderBy: { date: 'asc' },
    });

    // Group by ISO week label
    const weekMap: Record<string, { week: string; consultations: number; completed: number }> = {};
    for (const apt of appointments) {
      const d = new Date(apt.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const label = weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      if (!weekMap[label]) weekMap[label] = { week: label, consultations: 0, completed: 0 };
      weekMap[label].consultations++;
      if (apt.status === 'COMPLETED') weekMap[label].completed++;
    }
    const consultationTrend = Object.values(weekMap);

    // Repeat client rate
    const clientCounts: Record<string, number> = {};
    for (const apt of appointments) {
      clientCounts[apt.clientId] = (clientCounts[apt.clientId] || 0) + 1;
    }
    const totalClients = Object.keys(clientCounts).length;
    const repeatClients = Object.values(clientCounts).filter(c => c > 1).length;
    const repeatClientRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;

    // Income trend by week from escrow releases
    const escrows = await this.prisma.escrow.findMany({
      where: {
        recipientId: userId,
        status: 'RELEASED',
        releasedAt: { gte: since },
      },
      select: { amount: true, currency: true, releasedAt: true },
      orderBy: { releasedAt: 'asc' },
    });

    const incomeMap: Record<string, { week: string; income: number; currency: string }> = {};
    for (const e of escrows) {
      if (!e.releasedAt) continue;
      const d = new Date(e.releasedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const label = weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      if (!incomeMap[label]) incomeMap[label] = { week: label, income: 0, currency: e.currency || 'NGN' };
      incomeMap[label].income += Number(e.amount);
    }
    const incomeTrend = Object.values(incomeMap);

    // Rating breakdown
    const allReviews = await this.prisma.babalawoReview.findMany({
      where: { babalawoId: userId },
      select: { rating: true },
    });
    const ratingBreakdown = [1, 2, 3, 4, 5].map(star => ({
      stars: star,
      count: allReviews.filter((r: any) => r.rating === star).length,
    }));

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((allReviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    return {
      period,
      consultationTrend,
      repeatClientRate,
      totalClients,
      repeatClients,
      incomeTrend,
      ratingBreakdown,
      averageRating,
      totalReviews,
    };
  }

  /**
   * Get dashboard summary for a vendor user
   */
  async getVendorSummary(userId: string): Promise<VendorDashboardSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get vendor profile
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!vendor) {
      return {
        inventoryStatus: {
          totalProducts: 0,
          activeProducts: 0,
          lowStock: 0,
          outOfStock: 0,
        },
        recentOrders: [],
        monthlyRevenue: {
          amount: 0,
          currency: 'NGN',
          orderCount: 0,
        },
        pendingMessages: 0,
        topProducts: [],
      };
    }

    // Get inventory status
    const products = await this.prisma.product.findMany({
      where: { vendorId: vendor.id },
      select: { id: true, name: true, price: true, currency: true, stock: true, status: true },
    });

    const inventoryStatus = {
      totalProducts: products.length,
      activeProducts: products.filter((p: any) => p.status === 'ACTIVE').length,
      lowStock: products.filter((p: any) => p.stock !== null && p.stock > 0 && p.stock <= 5).length,
      outOfStock: products.filter((p: any) => p.stock === 0).length,
    };

    // Get recent orders
    const orders = await this.prisma.order.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: {
          select: { name: true },
        },
        items: {
          select: { id: true },
        },
      },
    });

    const recentOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      customerName: order.customer?.name || 'Unknown',
      totalAmount: Number(order.totalAmount),
      currency: order.currency || 'NGN',
      status: order.status,
      createdAt: order.createdAt,
      itemCount: order.items.length,
    }));

    // Get monthly revenue
    const monthlyOrders = await this.prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        status: { in: ['COMPLETED', 'DELIVERED'] },
        createdAt: { gte: startOfMonth },
      },
      select: { totalAmount: true, currency: true },
    });

    const monthlyRevenue = {
      amount: monthlyOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0),
      currency: monthlyOrders[0]?.currency || 'NGN',
      orderCount: monthlyOrders.length,
    };

    // Get pending messages
    const pendingMessages = await this.prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });

    // Get top products
    const topProducts = products
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        currency: p.currency || 'NGN',
        stockLevel: p.stock || 0,
        salesCount: 0,
      }))
      .slice(0, 5);

    return {
      inventoryStatus,
      recentOrders,
      monthlyRevenue,
      pendingMessages,
      topProducts,
    };
  }
}
