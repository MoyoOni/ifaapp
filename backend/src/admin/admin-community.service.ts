import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CirclesService } from '../circles/circles.service';
import { CreateAdvisoryVoteDto } from './dto/advisory-board.dto';
import { CreateCircleDto } from '../circles/dto/create-circle.dto';

@Injectable()
export class AdminCommunityService {
  private readonly logger = new Logger(AdminCommunityService.name);

  constructor(
    private prisma: PrismaService,
    private circlesService: CirclesService
  ) {}

  /**
   * Get reported content (flagged reviews)
   */
  async getReportedContent(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view reported content');
    }

    const [productReviews, babalawoReviews, courseReviews] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      this.prisma.babalawoReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          client: { select: { id: true, name: true, email: true } },
          babalawo: { select: { id: true, name: true } },
        },
      }),
      this.prisma.courseReview.findMany({
        where: { flaggedCount: { gt: 0 }, status: { not: 'REMOVED' } },
        include: {
          student: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
    ]);

    // Normalize
    const reports = [
      ...productReviews.map((r: any) => ({
        id: r.id,
        type: 'PRODUCT_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community', // Aggregated
        targetId: r.productId,
        targetName: r.product.name,
        authorName: r.customer.name,
        createdAt: r.createdAt,
      })),
      ...babalawoReviews.map((r: any) => ({
        id: r.id,
        type: 'BABALAWO_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community',
        targetId: r.babalawoId,
        targetName: r.babalawo.name,
        authorName: r.client.name,
        createdAt: r.createdAt,
      })),
      ...courseReviews.map((r: any) => ({
        id: r.id,
        type: 'COURSE_REVIEW',
        content: r.content,
        rating: r.rating,
        flaggedCount: r.flaggedCount,
        reporter: 'Community',
        targetId: r.courseId,
        targetName: r.course.title,
        authorName: r.student.name,
        createdAt: r.createdAt,
      })),
    ];

    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Resolve reported content
   */
  async resolveReportedContent(
    reportType: string,
    reportId: string,
    action: string,
    currentUser: CurrentUserPayload,
    reason?: string
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can resolve reported content');
    }

    // Implementation for resolving reported content
    // This would vary depending on the reportType and action
    switch (reportType) {
      case 'PRODUCT_REVIEW':
        if (action === 'REMOVE') {
          return this.prisma.productReview.update({
            where: { id: reportId },
            data: { status: 'REMOVED', moderationNotes: reason },
          });
        } else if (action === 'DISMISS') {
          return this.prisma.productReview.update({
            where: { id: reportId },
            data: { flaggedCount: 0 }, // Clear flags
          });
        }
        break;
      case 'BABALAWO_REVIEW':
        if (action === 'REMOVE') {
          return this.prisma.babalawoReview.update({
            where: { id: reportId },
            data: { status: 'REMOVED', moderationNotes: reason },
          });
        } else if (action === 'DISMISS') {
          return this.prisma.babalawoReview.update({
            where: { id: reportId },
            data: { flaggedCount: 0 }, // Clear flags
          });
        }
        break;
      case 'COURSE_REVIEW':
        if (action === 'REMOVE') {
          return this.prisma.courseReview.update({
            where: { id: reportId },
            data: { status: 'REMOVED', moderationNotes: reason },
          });
        } else if (action === 'DISMISS') {
          return this.prisma.courseReview.update({
            where: { id: reportId },
            data: { flaggedCount: 0 }, // Clear flags
          });
        }
        break;
    }

    throw new BadRequestException(`Unsupported report type: ${reportType} or action: ${action}`);
  }

  /**
   * Create an advisory board vote
   */
  async createAdvisoryVote(createVoteDto: CreateAdvisoryVoteDto, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create advisory votes');
    }

    // voteOptions must be persisted as AdvisoryVoteOption rows -- castAdvisoryVote
    // validates a cast option against vote.options, so a vote created without
    // them can never actually be voted on.
    return this.prisma.advisoryVote.create({
      data: {
        title: createVoteDto.title,
        description: createVoteDto.description,
        proposerId: currentUser.id,
        deadline: new Date(createVoteDto.deadline),
        requiredMajority: createVoteDto.requiredMajority,
        status: 'PENDING',
        options: {
          create: createVoteDto.voteOptions.map((option) => ({ option })),
        },
      },
      include: { options: true },
    });
  }

  /**
   * Get advisory board votes
   */
  async getAdvisoryVotes(userId: string, status: string | null, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view advisory votes');
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.advisoryVote.findMany({
      where,
      include: {
        proposer: { select: { id: true, name: true } },
        options: true,
        casts: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cast a vote in an advisory board vote
   */
  async castAdvisoryVote(voteId: string, option: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can cast advisory votes');
    }

    // Find the vote and the option
    const vote = await this.prisma.advisoryVote.findUnique({
      where: { id: voteId },
      include: { options: true },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    const selectedOption = vote.options.find((opt) => opt.option === option);
    if (!selectedOption) {
      throw new BadRequestException('Invalid option');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.advisoryVoteCast.findUnique({
      where: {
        userId_voteId: { userId: currentUser.id, voteId },
      },
    });

    if (existingVote) {
      throw new BadRequestException('User has already voted');
    }

    // Record the vote
    const voteCast = await this.prisma.advisoryVoteCast.create({
      data: {
        userId: currentUser.id,
        voteId,
        option,
      },
    });

    // Increment the vote count for the option
    await this.prisma.advisoryVoteOption.update({
      where: { id: selectedOption.id },
      data: {
        voteCount: { increment: 1 },
      },
    });

    return voteCast;
  }

  /**
   * Get circle suggestions with optional status filter
   */
  async getCircleSuggestions(currentUser: CurrentUserPayload, status?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view circle suggestions');
    }

    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.circleSuggestion.findMany({
      where,
      include: {
        suggester: { select: { id: true, name: true, email: true } },
        circle: true,
        reviewer: { select: { id: true, name: true } },
        thread: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve circle suggestion and create circle
   */
  async approveCircleSuggestion(
    suggestionId: string,
    circleData: CreateCircleDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve circle suggestions');
    }

    const suggestion = await this.prisma.circleSuggestion.findUnique({
      where: { id: suggestionId },
      include: { suggester: true },
    });

    if (!suggestion) {
      throw new NotFoundException('Circle suggestion not found');
    }

    // First, get the actual user to have complete info
    const user = await this.prisma.user.findUnique({
      where: { id: suggestion.suggestedBy },
    });

    if (!user) {
      throw new NotFoundException('Suggester not found');
    }

    // Create the circle with the original suggester as the creator
    const circle = await this.circlesService.create(circleData, {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role as any, // Assuming user.role matches UserRole enum
      verified: user.verified,
    });

    // Update the suggestion
    await this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'APPROVED',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        circleId: circle.id,
      },
    });

    return circle;
  }

  /**
   * Reject circle suggestion
   */
  async rejectCircleSuggestion(
    suggestionId: string,
    reason: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reject circle suggestions');
    }

    const suggestion = await this.prisma.circleSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new NotFoundException('Circle suggestion not found');
    }

    return this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        notes: reason,
      },
    });
  }

  /**
   * Get pending circles (circles needing approval)
   */
  async getPendingCircles(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view pending circles');
    }

    return this.prisma.circle.findMany({
      where: { status: 'PENDING' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        suggester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Moderate circle (archive, delete, etc.)
   */
  async moderateCircle(
    circleId: string,
    action: 'ARCHIVE' | 'DELETE' | 'ACTIVATE',
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate circles');
    }

    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    switch (action) {
      case 'ARCHIVE':
        return this.prisma.circle.update({
          where: { id: circleId },
          data: { active: false, status: 'ARCHIVED' },
        });
      case 'DELETE':
        return this.prisma.circle.update({
          where: { id: circleId },
          data: { active: false, status: 'DELETED' },
        });
      case 'ACTIVATE':
        return this.prisma.circle.update({
          where: { id: circleId },
          data: { active: true, status: 'ACTIVE' },
        });
      default:
        throw new BadRequestException('Invalid action');
    }
  }

  /**
   * V8-204: Circle.isDevoted already existed in the schema and
   * circles.service.ts already gates joining on it -- but nothing anywhere
   * let anyone actually turn it on for a circle. Deliberately admin-only
   * (not exposed on the general circle-update DTO a circle's own
   * creator/circle-admin can call) since gating a circle behind the paid
   * tier is a platform monetisation decision, not something a circle owner
   * should be able to flip on their own circle unilaterally.
   */
  async setCircleDevoted(circleId: string, isDevoted: boolean, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can mark a circle as Devoted-only');
    }

    const circle = await this.prisma.circle.findUnique({ where: { id: circleId } });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    return this.prisma.circle.update({
      where: { id: circleId },
      data: { isDevoted },
    });
  }

  /**
   * Approve circle event
   */
  async approveCircleEvent(eventId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve circle events');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'APPROVED' },
    });
  }

  /**
   * Get community stars data: top posters, top streaks, recent badges
   */
  async getCommunityStars() {
    // Get top posters (users with most forum posts)
    const topPostersGrouped = await this.prisma.forumPost.groupBy({
      by: ['authorId'],
      where: { status: 'ACTIVE' },
      _count: { authorId: true },
      orderBy: { _count: { authorId: 'desc' } },
      take: 10,
    });
    const topPostersRaw = topPostersGrouped.map((g) => ({
      authorId: g.authorId,
      count: g._count.authorId,
    }));

    const topPosterUserIds = topPostersRaw.map((p) => p.authorId);
    const topPosterUsers = await this.prisma.user.findMany({
      where: { id: { in: topPosterUserIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        contributionStreak: true,
        longestStreak: true,
        isCommunityBuilder: true,
      },
    });

    const topPosters = topPostersRaw.map((raw) => {
      const user = topPosterUsers.find((u) => u.id === raw.authorId);
      return {
        id: user?.id || raw.authorId,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        avatar: user?.avatar,
        postCount: raw.count,
        contributionStreak: user?.contributionStreak,
        longestStreak: user?.longestStreak,
        isCommunityBuilder: user?.isCommunityBuilder,
      };
    });

    // Get top streaks (users with highest contribution streak)
    const topStreaks = await this.prisma.user
      .findMany({
        where: {
          contributionStreak: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          contributionStreak: true,
          longestStreak: true,
          isCommunityBuilder: true,
        },
        orderBy: { contributionStreak: 'desc' },
        take: 10,
      })
      .then((users) =>
        users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          postCount: undefined, // Will be calculated separately if needed
          contributionStreak: user.contributionStreak,
          longestStreak: user.longestStreak,
          isCommunityBuilder: user.isCommunityBuilder,
        }))
      );

    // Get recent badges
    const recentBadges = await this.prisma.userBadge.findMany({
      take: 10,
      orderBy: { awardedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        awardedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Map badge keys to badge names using preset list
    const badgeNameMap: Record<string, string> = {
      'elder-voice': 'Elder Voice',
      'community-pillar': 'Community Pillar',
      'culture-keeper': 'Culture Keeper',
      'oral-historian': 'Oral Historian',
      'forum-guide': 'Forum Guide',
    };

    const recentBadgesMapped = recentBadges.map((badge) => {
      // Get human-readable badge name from the map, or humanize the badgeKey if not found
      const badgeName =
        badgeNameMap[badge.badgeKey] ||
        badge.badgeKey
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      return {
        id: badge.id,
        badgeName,
        badgeSlug: badge.badgeKey,
        description: undefined, // Description is not stored in the DB, only for presets in frontend
        awardedAt: badge.awardedAt.toISOString(),
        message: badge.reason || undefined,
        user: badge.user
          ? {
              id: badge.user.id,
              name: badge.user.name,
              email: badge.user.email,
              avatar: badge.user.avatar,
            }
          : undefined,
        awarder: badge.awardedBy
          ? {
              id: badge.awardedBy.id,
              name: badge.awardedBy.name,
            }
          : undefined,
      };
    });

    return {
      topPosters,
      topStreaks,
      recentBadges: recentBadgesMapped,
    };
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: string,
    badgeData: {
      badgeName: string;
      badgeSlug: string;
      description?: string;
      message?: string;
      promoteToBuilder?: boolean;
    },
    adminId: string
  ) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create the badge
    const badge = await this.prisma.userBadge.create({
      data: {
        userId,
        badgeKey: badgeData.badgeSlug,
        reason: badgeData.message || undefined,
        awardedById: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        awardedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Promote to community builder if requested
    if (badgeData.promoteToBuilder) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isCommunityBuilder: true },
      });
    }

    // Map the response to match frontend expectations
    const badgeNameMap: Record<string, string> = {
      'elder-voice': 'Elder Voice',
      'community-pillar': 'Community Pillar',
      'culture-keeper': 'Culture Keeper',
      'oral-historian': 'Oral Historian',
      'forum-guide': 'Forum Guide',
    };

    const badgeName =
      badgeNameMap[badge.badgeKey] ||
      badge.badgeKey
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
      id: badge.id,
      badgeName,
      badgeSlug: badge.badgeKey,
      description: undefined, // Description is not stored in the DB
      awardedAt: badge.awardedAt.toISOString(),
      message: badge.reason || undefined,
      user: badge.user
        ? {
            id: badge.user.id,
            name: badge.user.name,
            email: badge.user.email,
            avatar: badge.user.avatar,
          }
        : undefined,
      awarder: badge.awardedBy
        ? {
            id: badge.awardedBy.id,
            name: badge.awardedBy.name,
          }
        : undefined,
    };
  }

  /**
   * Revoke/delete a badge
   */
  async revokeBadge(badgeId: string) {
    const badge = await this.prisma.userBadge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    await this.prisma.userBadge.delete({
      where: { id: badgeId },
    });
  }
}
