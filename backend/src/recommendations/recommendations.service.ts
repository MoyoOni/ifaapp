import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

/**
 * Recommendations Service
 * Rule-based recommendation engine for personalized content
 * NOTE: In production, could be enhanced with ML-based recommendations
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get personalized recommendations for user
   * Based on user role, interests, past activity, and cultural level
   */
  async getRecommendations(userId: string, currentUser: CurrentUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        babalawoClients: {
          take: 1,
          where: { relationshipType: 'PERSONAL_AWO', status: 'ACTIVE' },
          include: {
            babalawo: {
              select: {
                id: true,
                templeId: true,
              },
            },
          },
        },
        ordersPlaced: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    category: true,
                  },
                },
              },
            },
          },
        },
        enrollments: {
          take: 5,
          orderBy: { enrolledAt: 'desc' },
          include: {
            course: {
              select: {
                category: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return this.getDefaultRecommendations();
    }

    const recommendations: any = {
      featuredBabalawos: [],
      featuredTemples: [],
      featuredProducts: [],
      featuredCourses: [],
      upcomingEvents: [],
      suggestedContent: [],
    };

    // Rule 1: If user has Personal Awo, recommend related content
    if (user.babalawoClients && user.babalawoClients.length > 0) {
      const personalAwo = user.babalawoClients[0];
      // Recommend other Babalawos from same temple
      if (personalAwo.babalawo.templeId) {
        const templeBabalawos = await this.prisma.user.findMany({
          where: {
            role: 'BABALAWO',
            templeId: personalAwo.babalawo.templeId,
            id: { not: personalAwo.babalawoId },
            verified: true,
          },
          take: 3,
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        });
        recommendations.featuredBabalawos.push(...templeBabalawos);
      }
    }

    // Rule 2: Recommend based on user's temple membership
    if (user.templeId) {
      const temple = await this.prisma.temple.findUnique({
        where: { id: user.templeId },
        include: {
          babalawos: {
            where: { verified: true },
            take: 5,
            select: {
              id: true,
              name: true,
              yorubaName: true,
              avatar: true,
              verified: true,
            },
          },
        },
      });
      if (temple) {
        recommendations.featuredTemples.push(temple);
      }
    }

    // Rule 3: Recommend products based on past purchases
    if (user.ordersPlaced && user.ordersPlaced.length > 0) {
      const purchasedCategories = new Set<string>();
      user.ordersPlaced.forEach((order) => {
        order.items.forEach((item) => {
          if (item.product.category) {
            purchasedCategories.add(item.product.category);
          }
        });
      });

      if (purchasedCategories.size > 0) {
        const similarProducts = await this.prisma.product.findMany({
          where: {
            category: { in: Array.from(purchasedCategories) },
            status: 'ACTIVE',
            id: { notIn: user.ordersPlaced.flatMap((o) => o.items.map((i) => i.productId)) },
          },
          take: 6,
          include: {
            vendor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });
        recommendations.featuredProducts.push(...similarProducts);
      }
    }

    // Rule 4: Recommend courses based on enrollment history
    if (user.enrollments && user.enrollments.length > 0) {
      const enrolledCategories = new Set<string>();
      const enrolledLevels = new Set<string>();
      user.enrollments.forEach(
        (enrollment: {
          course: { category?: string | null; level?: string | null };
          courseId: string;
        }) => {
          if (enrollment.course.category) {
            enrolledCategories.add(enrollment.course.category);
          }
          if (enrollment.course.level) {
            enrolledLevels.add(enrollment.course.level);
          }
        }
      );

      if (enrolledCategories.size > 0 || enrolledLevels.size > 0) {
        const enrolledCourseIds = user.enrollments.map((e: { courseId: string }) => e.courseId);
        const similarCourses = await this.prisma.course.findMany({
          where: {
            OR: [
              { category: { in: Array.from(enrolledCategories) } },
              { level: { in: Array.from(enrolledLevels) } },
            ],
            status: 'PUBLISHED',
            id: { notIn: enrolledCourseIds },
          },
          take: 4,
          include: {
            instructor: {
              select: {
                name: true,
                yorubaName: true,
              },
            },
          },
        });
        recommendations.featuredCourses.push(...similarCourses);
      }
    }

    // Rule 5: If no personal data, show popular/featured content
    if (
      recommendations.featuredBabalawos.length === 0 &&
      recommendations.featuredProducts.length === 0 &&
      recommendations.featuredCourses.length === 0
    ) {
      return this.getDefaultRecommendations();
    }

    // Rule 6: Fill remaining slots with popular content
    const remainingBabalawos = 5 - recommendations.featuredBabalawos.length;
    if (remainingBabalawos > 0) {
      const popularBabalawos = await this.prisma.user.findMany({
        where: {
          role: 'BABALAWO',
          verified: true,
        },
        take: remainingBabalawos,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          yorubaName: true,
          avatar: true,
          verified: true,
        },
      });
      recommendations.featuredBabalawos.push(...popularBabalawos);
    }

    return recommendations;
  }

  /**
   * Get default recommendations (for new users or when no personal data)
   */
  private async getDefaultRecommendations() {
    const [featuredBabalawos, featuredTemples, featuredProducts, featuredCourses] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { role: 'BABALAWO', verified: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
          },
        }),
        this.prisma.temple.findMany({
          where: { verified: true, status: 'ACTIVE' },
          take: 3,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.findMany({
          where: { status: 'ACTIVE' },
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            vendor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.course.findMany({
          where: { status: 'PUBLISHED' },
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: {
            instructor: {
              select: {
                name: true,
                yorubaName: true,
              },
            },
          },
        }),
      ]);

    return {
      featuredBabalawos,
      featuredTemples,
      featuredProducts,
      featuredCourses,
      upcomingEvents: [],
      suggestedContent: [],
    };
  }
}
