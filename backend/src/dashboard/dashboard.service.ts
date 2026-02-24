import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClientDashboardSummary,
  BabalawoDashboardSummary,
  VendorDashboardSummary,
  ConsultationSummary,
  GuidancePlanSummary,
} from './dto/dashboard-summary.dto';

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

    const recentConsultations: ConsultationSummary[] = appointments.map((apt) => ({
      id: apt.id,
      clientId: apt.clientId,
      clientName: '',
      babalawoId: apt.babalawoId,
      babalawoName: apt.babalawo?.name || 'Unknown',
      scheduledDate: new Date(`${apt.date}T${apt.time}`),
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

    const pendingGuidancePlans: GuidancePlanSummary[] = guidancePlans.map((plan) => ({
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
        temples: (user?.templesJoined || []).map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          location: t.location || undefined,
          memberCount: 0,
        })),
        circles: (user?.circleMemberships || []).map((m) => ({
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

    const upcomingConsultations: ConsultationSummary[] = upcomingAppointments.map((apt) => ({
      id: apt.id,
      clientId: apt.clientId,
      clientName: apt.client?.name || 'Unknown',
      clientAvatar: apt.client?.avatar || undefined,
      babalawoId: apt.babalawoId,
      babalawoName: '',
      scheduledDate: new Date(`${apt.date}T${apt.time}`),
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

    const pendingGuidancePlans: GuidancePlanSummary[] = pendingPlans.map((plan) => ({
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

    const activeClients = babalawoClients.map((bc) => ({
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
      amount: monthlyEscrows.reduce((sum, e) => sum + Number(e.amount), 0),
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
      activeProducts: products.filter((p) => p.status === 'ACTIVE').length,
      lowStock: products.filter((p) => p.stock !== null && p.stock > 0 && p.stock <= 5).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
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

    const recentOrders = orders.map((order) => ({
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
      amount: monthlyOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
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
      .map((p) => ({
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
