import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminMarketIntelligenceService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(sortBy: 'bookings' | 'revenue' | 'rating') {
    const practitioners = await this.prisma.user.findMany({
      where: { role: 'BABALAWO' },
      select: {
        id: true,
        name: true,
        trustScore: true,
        appointmentsAsBabalawo: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { price: true, date: true },
        },
        babalawoReviewsReceived: {
          select: { rating: true },
        },
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const results = practitioners.map((p) => {
      const allBookings = p.appointmentsAsBabalawo;
      const thisMonthBookings = allBookings.filter((a: any) => new Date(a.date) >= startOfMonth);
      const lastMonthBookings = allBookings.filter(
        (a: any) => new Date(a.date) >= startOfLastMonth && new Date(a.date) < startOfMonth,
      );
      const totalBookings = allBookings.length;
      const thisMonthRevenue = thisMonthBookings.reduce((sum: number, a: any) => sum + (a.price || 0), 0);
      const totalRevenue = allBookings.reduce((sum: number, a: any) => sum + (a.price || 0), 0);
      const avgConsultationPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const totalReviews = p.babalawoReviewsReceived.length;
      const averageRating =
        totalReviews > 0
          ? p.babalawoReviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
          : 0;
      const momGrowth =
        lastMonthBookings.length > 0
          ? (thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length
          : 0;

      return {
        id: p.id,
        name: p.name,
        trustScore: p.trustScore || 0,
        totalBookings,
        thisMonthBookings: thisMonthBookings.length,
        momGrowth,
        thisMonthRevenue,
        avgConsultationPrice,
        averageRating,
        totalReviews,
      };
    });

    // Sort
    switch (sortBy) {
      case 'bookings':
        results.sort((a, b) => b.totalBookings - a.totalBookings);
        break;
      case 'revenue':
        results.sort((a, b) => b.thisMonthRevenue - a.thisMonthRevenue);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      default:
        results.sort((a, b) => b.totalBookings - a.totalBookings);
    }

    return results;
  }

  async getSignals() {
    const practitioners = await this.prisma.user.findMany({
      where: { role: 'BABALAWO' },
      select: {
        id: true,
        name: true,
        appointmentsAsBabalawo: {
          where: { status: { in: ['COMPLETED', 'CONFIRMED'] } },
          select: { price: true },
        },
        templesFounded: {
          select: {
            specialties: true
          }
        },
        templesJoined: {
          select: {
            specialties: true
          }
        }
      },
    });

    // Top practitioners by bookings
    const withCounts = practitioners.map((p) => ({
      name: p.name,
      bookings: p.appointmentsAsBabalawo.length,
      revenue: p.appointmentsAsBabalawo.reduce((sum: number, a: any) => sum + (a.price || 0), 0),
    }));
    withCounts.sort((a, b) => b.bookings - a.bookings);
    const topPractitioners = withCounts.slice(0, 5);

    // Top specialisations - aggregate from all temples associated with practitioners
    const specCount: Record<string, number> = {};
    
    for (const p of practitioners) {
      // Add specialties from temples they founded
      if (p.templesFounded) {
        for (const spec of p.templesFounded.specialties) {
          specCount[spec] = (specCount[spec] || 0) + 1;
        }
      }
      
      // Add specialties from temples they're members of
      for (const temple of p.templesJoined) {
        for (const spec of temple.specialties) {
          specCount[spec] = (specCount[spec] || 0) + 1;
        }
      }
    }
    
    const topSpecialisations = Object.entries(specCount)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Pricing
    const prices = practitioners
      .flatMap((p) => p.appointmentsAsBabalawo.map((a: any) => a.price))
      .filter((p) => p > 0);
    const avgConsultationPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      topPractitioners,
      topSpecialisations,
      avgConsultationPrice,
      minPrice,
      maxPrice,
    };
  }
}