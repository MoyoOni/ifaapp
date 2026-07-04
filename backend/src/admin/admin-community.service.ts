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
    type: string,
    id: string,
    action: 'DISMISS' | 'REMOVE',
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can resolve reports');
    }

    const updateData = {
      status: action === 'REMOVE' ? 'REMOVED' : 'ACTIVE', // If dismissed, verify status is active
      moderatedBy: currentUser.id,
      moderatedAt: new Date(),
      moderationNotes: `Report resolved: ${action}`,
      flaggedCount: action === 'DISMISS' ? 0 : undefined, // Reset flags if dismissed
    };

    if (type === 'PRODUCT_REVIEW') {
      return this.prisma.productReview.update({ where: { id }, data: updateData });
    } else if (type === 'BABALAWO_REVIEW') {
      return this.prisma.babalawoReview.update({ where: { id }, data: updateData });
    } else if (type === 'COURSE_REVIEW') {
      return this.prisma.courseReview.update({ where: { id }, data: updateData });
    } else {
      throw new BadRequestException('Invalid content type');
    }
  }

  /**
   * Create an advisory board vote
   */
  async createAdvisoryVote(
    userId: string,
    createVoteDto: CreateAdvisoryVoteDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can create votes');
    }

    // Verify user is an advisory board member
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can create votes');
    }

    // Create the vote
    const vote = await this.prisma.advisoryVote.create({
      data: {
        title: createVoteDto.title,
        description: createVoteDto.description,
        proposerId: userId,
        deadline: new Date(createVoteDto.deadline),
        requiredMajority: createVoteDto.requiredMajority,
        status: 'PENDING', // Will be activated when quorum is met
        options: {
          create: createVoteDto.voteOptions.map((option) => ({
            option,
            voteCount: 0,
          })),
        },
      },
      include: {
        options: true,
        proposer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            role: true,
          },
        },
      },
    });

    return vote;
  }

  /**
   * Get advisory board votes
   */
  async getAdvisoryVotes(userId: string, status: string | null, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can view votes');
    }

    const where: any = {};
    if (status) {
      const statuses = status.split(',');
      where.status = { in: statuses };
    }

    const votes = await this.prisma.advisoryVote.findMany({
      where,
      include: {
        options: {
          select: {
            option: true,
            voteCount: true,
          },
        },
        proposer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            role: true,
          },
        },
        casts: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format results to match frontend expectations
    return votes.map((vote: any) => {
      const totalVotes = vote.casts.length;
      const yesVotes =
        vote.options.find((opt: any) => opt.option.toLowerCase() === 'yes')?.voteCount || 0;
      const noVotes =
        vote.options.find((opt: any) => opt.option.toLowerCase() === 'no')?.voteCount || 0;
      const abstainVotes = totalVotes - yesVotes - noVotes;

      return {
        ...vote,
        votes: {
          yes: yesVotes,
          no: noVotes,
          abstain: abstainVotes,
        },
        voterCount: totalVotes,
        voteOptions: vote.options.map((opt: any) => opt.option),
        results: vote.options.map((opt: any) => ({
          option: opt.option,
          count: opt.voteCount,
          percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
        })),
      };
    });
  }

  /**
   * Cast a vote in an advisory board vote
   */
  async castAdvisoryVote(voteId: string, option: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ADVISORY_BOARD_MEMBER') {
      throw new ForbiddenException('Only advisory board members can vote');
    }

    // Check if vote exists and is active
    const vote = await this.prisma.advisoryVote.findUnique({
      where: { id: voteId },
      include: {
        options: true,
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    if (vote.status !== 'ACTIVE' && vote.status !== 'PENDING') {
      throw new BadRequestException('Vote is not active');
    }

    if (new Date(vote.deadline) < new Date()) {
      throw new BadRequestException('Vote deadline has passed');
    }

    // Check if user has already voted
    const existingVote = await this.prisma.advisoryVoteCast.findFirst({
      where: {
        voteId,
        userId: currentUser.id,
      },
    });

    if (existingVote) {
      throw new BadRequestException('You have already voted in this poll');
    }

    // Verify the option is valid
    const validOption = vote.options.find((opt: any) => opt.option === option);
    if (!validOption) {
      throw new BadRequestException('Invalid vote option');
    }

    // Create the vote cast
    const voteCast = await this.prisma.advisoryVoteCast.create({
      data: {
        voteId,
        userId: currentUser.id,
        option,
      },
    });

    // Increment the option count
    await this.prisma.advisoryVoteOption.update({
      where: {
        id: validOption.id,
      },
      data: {
        voteCount: {
          increment: 1,
        },
      },
    });

    // Update vote status if quorum is met (more than 50% of advisory board members)
    const totalAdvisoryMembers = await this.prisma.user.count({
      where: { role: 'ADVISORY_BOARD_MEMBER' },
    });

    const currentVotes = await this.prisma.advisoryVoteCast.count({
      where: { voteId },
    });

    if (currentVotes > totalAdvisoryMembers / 2 && vote.status === 'PENDING') {
      await this.prisma.advisoryVote.update({
        where: { id: voteId },
        data: { status: 'ACTIVE' },
      });
    }

    // Check if vote has ended and determine result
    if (new Date(vote.deadline) < new Date()) {
      await this.determineVoteResult(voteId);
    }

    return voteCast;
  }

  /**
   * Determine and finalize vote result
   */
  private async determineVoteResult(voteId: string) {
    const vote = await this.prisma.advisoryVote.findUnique({
      where: { id: voteId },
      include: {
        options: true,
        casts: true,
      },
    });

    if (!vote || vote.status !== 'ACTIVE') {
      return;
    }

    // Calculate results
    const totalVotes = vote.casts.length;
    if (totalVotes === 0) {
      await this.prisma.advisoryVote.update({
        where: { id: voteId },
        data: { status: 'REJECTED' },
      });
      return;
    }

    // Find the winning option
    const winner = vote.options.reduce((prev: any, current: any) =>
      prev.voteCount > current.voteCount ? prev : current
    );

    // Check if it meets the required majority
    let status: string;
    const requiredMajority = vote.requiredMajority;

    if (requiredMajority === 'UNANIMOUS' && winner.voteCount !== totalVotes) {
      status = 'REJECTED';
    } else if (requiredMajority === 'SUPER' && winner.voteCount / totalVotes < 0.75) {
      status = 'REJECTED';
    } else if (requiredMajority === 'SIMPLE' && winner.voteCount / totalVotes <= 0.5) {
      status = 'REJECTED';
    } else {
      status = 'APPROVED';
    }

    // Update vote status
    await this.prisma.advisoryVote.update({
      where: { id: voteId },
      data: { status: status as any },
    });
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
        suggester: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

    return this.circlesService.createFromSuggestion(suggestionId, circleData, currentUser);
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

    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException('Suggestion has already been processed');
    }

    return this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'REJECTED',
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        notes: reason,
      },
      include: {
        suggester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
          },
        },
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
      where: {
        status: 'PENDING_APPROVAL',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        suggester: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
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

    // Soft delete (P0-03): DELETE used to hard-delete the circle, cascading
    // to destroy every member/feed-post row with no recovery path for an
    // admin moderation action. Routed through the same status-update path as
    // ARCHIVE/ACTIVATE below, just with its own status value.
    const statusMap = {
      ARCHIVE: 'ARCHIVED',
      ACTIVATE: 'ACTIVE',
      DELETE: 'DELETED',
    };

    return this.prisma.circle.update({
      where: { id: circleId },
      data: {
        status: statusMap[action],
        active: action === 'ACTIVATE',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
      },
    });
  }

  /**
   * Approve and promote circle event to main events directory
   */
  async approveCircleEvent(eventId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve circle events');
    }

    // This will be implemented when EventsService is injected
    // For now, we'll use Prisma directly
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { circle: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.circleId) {
      throw new BadRequestException('This event is not associated with a circle');
    }

    // Publish the event
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        published: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: { in: ['REGISTERED', 'ATTENDED'] },
              },
            },
          },
        },
      },
    });
  }
}
