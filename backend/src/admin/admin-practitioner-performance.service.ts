import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminPractitionerPerformanceService {
  constructor(private prisma: PrismaService) {}

  async getPractitionerPerformance() {
    const practitioners = await this.prisma.user.findMany({
      where: { role: 'BABALAWO' },
      select: {
        id: true,
        name: true,
        email: true,
        trustScore: true,
        createdAt: true,
        userSessions: {
          select: { lastSeenAt: true },
          orderBy: { lastSeenAt: 'desc' },
          take: 1,
        },
        appointmentsAsBabalawo: {
          select: {
            id: true,
            date: true,
            price: true,
            status: true,
          },
        },
        babalawoReviewsReceived: {
          select: { rating: true },
        },
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return practitioners.map((p) => {
      const allAppointments = p.appointmentsAsBabalawo;
      const completed = allAppointments.filter((a) => a.status === 'COMPLETED');
      const confirmed = allAppointments.filter((a) => a.status === 'CONFIRMED');
      const totalConsultationsAllTime = completed.length;
      const thisMonthCompleted = completed.filter((a: any) => new Date(a.date) >= startOfMonth);
      const totalConsultationsThisMonth = thisMonthCompleted.length;

      // Revenue
      const revenueGenerated = completed.reduce((sum, a) => sum + Number(a.price || 0), 0);

      // Reviews
      const reviews = p.babalawoReviewsReceived;
      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

      // Response rate: confirmed / (confirmed + no-show?) – simplified: confirmed vs total
      const responseRate =
        allAppointments.length > 0 ? confirmed.length / allAppointments.length : 0;

      // No-show rate: count appointments with status NO_SHOW (if exists)
      const noShows = allAppointments.filter((a) => a.status === 'NO_SHOW');
      const noShowRate = allAppointments.length > 0 ? noShows.length / allAppointments.length : 0;

      // Days since last login
      const lastSession = p.userSessions[0];
      const daysSinceLastLogin = lastSession
        ? Math.floor(
            (now.getTime() - new Date(lastSession.lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      // Days since last consultation
      const lastConsultation = completed.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      const daysSinceLastConsultation = lastConsultation
        ? Math.floor(
            (now.getTime() - new Date(lastConsultation.date).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      // Status
      let status: 'Active' | 'Quiet' | 'Inactive' | 'At Risk';
      if (daysSinceLastConsultation <= 7) status = 'Active';
      else if (daysSinceLastConsultation <= 30) status = 'Quiet';
      else if (daysSinceLastConsultation <= 60) status = 'Inactive';
      else status = 'At Risk';

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        trustScore: p.trustScore || 0,
        totalConsultationsAllTime,
        totalConsultationsThisMonth,
        averageRating,
        totalReviews,
        responseRate,
        noShowRate,
        revenueGenerated,
        daysSinceLastLogin,
        daysSinceLastConsultation,
        lastLoginAt: lastSession?.lastSeenAt || null,
        lastConsultationAt: lastConsultation?.date || null,
        status,
      };
    });
  }
}
