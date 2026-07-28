import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

/**
 * Circles Service
 * Handles community circle creation, management, and membership
 */
@Injectable()
export class CirclesService {
  private readonly logger = new Logger(CirclesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly crisisDetection: CrisisDetectionService,
    private readonly notificationService: NotificationService
  ) {}

  // COMMUNITY_BACKLOG.md FOR-015: mirrors ForumService's private notifyAdmins
  // helper -- small enough (loop admins, create notification) that sharing it
  // isn't worth a cross-module dependency, unlike the crisis keyword logic
  // itself which now lives in exactly one place (CrisisDetectionService).
  private async notifyAdminsOfCrisis(
    title: string,
    message: string,
    data: Record<string, unknown>
  ) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
        take: 5,
      });
      admins.forEach(({ id }) => {
        this.notificationService
          .createNotification({
            userId: id,
            type: NotificationType.SYSTEM,
            category: NotificationCategory.WARNING,
            title,
            message,
            data,
          })
          .catch((err) => this.logger.error(`Failed to notify admin ${id}: ${title}`, err));
      });
    } catch (err) {
      this.logger.error('Failed to notify admins of crisis signal', err);
    }
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Create a new circle
   * Only admins can create circles directly
   */
  async create(dto: CreateCircleDto, currentUser: CurrentUserPayload) {
    // Only admins or Devoted members can create circles
    if (currentUser.role !== 'ADMIN') {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { subscriptionStatus: true },
      });
      if (user?.subscriptionStatus !== 'DEVOTED') {
        throw new ForbiddenException(
          'Creating circles is a Devoted member benefit. Join and participate in any existing circle for free.'
        );
      }
    }

    // Generate unique slug
    let slug = this.generateSlug(dto.name);
    let slugExists = await this.prisma.circle.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      slugExists = await this.prisma.circle.findUnique({ where: { slug } });
      counter++;
    }

    // Create circle
    const circle = await this.prisma.circle.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
        creatorId: currentUser.id,
        privacy: dto.privacy || 'PUBLIC',
        topics: dto.topics || [],
        location: dto.location,
        avatar: dto.avatar,
        banner: dto.banner,
        memberCount: 1, // Creator is first member
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
      },
    });

    // Add creator as admin member
    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return circle;
  }

  /**
   * Create a circle from a forum suggestion
   * Only admins can call this
   */
  async createFromSuggestion(
    suggestionId: string,
    dto: CreateCircleDto,
    currentUser: CurrentUserPayload
  ) {
    // Only admins can create circles from suggestions
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create circles from suggestions.');
    }

    // Get the suggestion
    const suggestion = await this.prisma.circleSuggestion.findUnique({
      where: { id: suggestionId },
      include: { thread: true, suggester: true },
    });

    if (!suggestion) {
      throw new NotFoundException('Circle suggestion not found');
    }

    if (suggestion.status !== 'PENDING') {
      throw new BadRequestException('Suggestion has already been processed');
    }

    // Generate unique slug
    let slug = this.generateSlug(dto.name);
    let slugExists = await this.prisma.circle.findUnique({ where: { slug } });
    let counter = 1;

    while (slugExists) {
      slug = `${this.generateSlug(dto.name)}-${counter}`;
      slugExists = await this.prisma.circle.findUnique({ where: { slug } });
      counter++;
    }

    // Create circle with suggestion tracking
    const circle = await this.prisma.circle.create({
      data: {
        name: dto.name,
        description: dto.description,
        slug,
        creatorId: currentUser.id, // Admin becomes creator
        privacy: dto.privacy || 'PUBLIC',
        topics: dto.topics || [],
        location: dto.location,
        avatar: dto.avatar,
        banner: dto.banner,
        memberCount: 1,
        status: 'ACTIVE',
        suggestedBy: suggestion.suggestedBy,
        suggestionThreadId: suggestion.threadId,
        approvedBy: currentUser.id,
        approvedAt: new Date(),
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
      },
    });

    // Add admin as circle admin member
    await this.prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: currentUser.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Optionally add suggester as member
    if (suggestion.suggestedBy !== currentUser.id) {
      await this.prisma.circleMember.create({
        data: {
          circleId: circle.id,
          userId: suggestion.suggestedBy,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
      // Update member count
      await this.prisma.circle.update({
        where: { id: circle.id },
        data: { memberCount: 2 },
      });
    }

    // Update suggestion status
    await this.prisma.circleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'APPROVED',
        circleId: circle.id,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });

    return circle;
  }

  /**
   * Freeform "suggest a new circle" (any logged-in user). Whole-app audit
   * Phase 3d: circle-directory.tsx's "Suggest a New Circle" button used to
   * show a fake success toast with no API call at all -- CircleSuggestion
   * previously required an existing forum thread (promote-a-thread flow),
   * which doesn't match a simple idea-submission button. threadId is now
   * nullable to support this path; admin's existing suggestion review queue
   * reads title/description directly when there's no thread to fall back on.
   */
  async suggestCircle(dto: { title: string; description: string }, currentUser: CurrentUserPayload) {
    return this.prisma.circleSuggestion.create({
      data: {
        suggestedBy: currentUser.id,
        title: dto.title,
        description: dto.description,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get all circles with filters
   */
  async findAll(filters?: {
    search?: string;
    privacy?: string;
    topic?: string;
    location?: string;
    active?: boolean;
  }) {
    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    } else {
      where.active = true; // Default to active only
    }

    if (filters?.privacy) {
      where.privacy = filters.privacy;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.topic) {
      where.topics = { has: filters.topic };
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    return this.prisma.circle.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get circle by ID or slug
   */
  async findOne(identifier: string, currentUser?: CurrentUserPayload) {
    const circle = await this.prisma.circle.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
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
        members: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
                verified: true,
              },
            },
          },
          take: 20, // Limit to first 20 members
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    // P0-03: a soft-deleted circle must 404 the same way a hard-deleted one
    // would have — findOne doesn't filter by status at the query level (it
    // needs to still find ARCHIVED circles for admin/member contexts), so the
    // DELETED check happens here instead.
    if (!circle || circle.status === 'DELETED') {
      throw new NotFoundException('Circle not found');
    }

    // Check if user is a member
    let userMembership = null;
    if (currentUser) {
      userMembership = await this.prisma.circleMember.findUnique({
        where: {
          circleId_userId: {
            circleId: circle.id,
            userId: currentUser.id,
          },
        },
      });
    }

    return {
      ...circle,
      userMembership,
    };
  }

  /**
   * Update circle
   */
  async update(circleId: string, dto: UpdateCircleDto, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          where: {
            userId: currentUser.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Check if user is admin or creator
    const isCreator = circle.creatorId === currentUser.id;
    const isAdmin = circle.members.some(
      (m: any) => m.userId === currentUser.id && m.role === 'ADMIN'
    );

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Only circle admins can update the circle');
    }

    // Update circle
    return this.prisma.circle.update({
      where: { id: circleId },
      data: {
        ...dto,
        memberCount: dto.active === false ? 0 : undefined, // Reset count if deactivated
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
      },
    });
  }

  /**
   * Delete circle
   */
  async delete(circleId: string, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (circle.creatorId !== currentUser.id) {
      throw new ForbiddenException('Only the circle creator can delete the circle');
    }

    // Soft delete (P0-03): a hard delete here cascades to destroy every
    // CircleMember/CircleFeedPost row with no recovery path. `status` already
    // has an 'ARCHIVED' value used by the admin moderation flow and is
    // filtered out of every listing query via an `status: 'ACTIVE'`
    // allowlist, so 'DELETED' is hidden the same way with zero schema change.
    await this.prisma.circle.update({
      where: { id: circleId },
      data: { status: 'DELETED', active: false },
    });

    return { success: true };
  }

  /**
   * Join a circle
   */
  async joinCircle(circleId: string, currentUser: CurrentUserPayload) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    if (!circle.active) {
      throw new BadRequestException('This circle is no longer active');
    }

    // Gate Devoted-only circles
    if (circle.isDevoted) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { subscriptionStatus: true },
      });
      if (user?.subscriptionStatus !== 'DEVOTED') {
        throw new ForbiddenException(
          'This circle is exclusive to Devoted members. Upgrade at /pricing.'
        );
      }
    }

    // Check if already a member
    const existingMembership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: currentUser.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        throw new BadRequestException('You are already a member of this circle');
      }
      // Reactivate membership
      await this.prisma.circleMember.update({
        where: { id: existingMembership.id },
        data: {
          status: 'ACTIVE',
          leftAt: null,
        },
      });
    } else {
      // Check privacy
      if (circle.privacy === 'INVITE_ONLY') {
        // Create pending membership
        await this.prisma.circleMember.create({
          data: {
            circleId,
            userId: currentUser.id,
            role: 'MEMBER',
            status: 'PENDING',
          },
        });
        throw new BadRequestException(
          'This circle requires an invitation. Your request is pending.'
        );
      }

      // Create active membership
      await this.prisma.circleMember.create({
        data: {
          circleId,
          userId: currentUser.id,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });
    }

    // Update member count
    await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    return { success: true, message: 'Successfully joined circle' };
  }

  /**
   * Become a Circle Patron (requires Devoted subscription)
   */
  async becomePatron(circleId: string, currentUser: CurrentUserPayload) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId: currentUser.id } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestException('You must be an active member to become a patron');
    }

    if (membership.role === 'PATRON') {
      throw new BadRequestException('You are already a patron of this circle');
    }

    // Verify Devoted subscription
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { subscriptionStatus: true },
    });

    if (user?.subscriptionStatus !== 'DEVOTED') {
      throw new ForbiddenException('Patron status requires a Devoted subscription');
    }

    return this.prisma.circleMember.update({
      where: { id: membership.id },
      data: { role: 'PATRON' },
    });
  }

  /**
   * Leave a circle
   */
  async leaveCircle(circleId: string, currentUser: CurrentUserPayload) {
    const membership = await this.prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: currentUser.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestException('You are not a member of this circle');
    }

    // Don't allow creator to leave (they must delete the circle)
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
    });

    if (circle?.creatorId === currentUser.id) {
      throw new BadRequestException('Circle creator cannot leave. Delete the circle instead.');
    }

    // Update membership status
    await this.prisma.circleMember.update({
      where: { id: membership.id },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    // Update member count
    await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        memberCount: {
          decrement: 1,
        },
      },
    });

    return { success: true, message: 'Successfully left circle' };
  }

  /**
   * Get user's circles
   */
  async getUserCircles(userId: string) {
    const memberships = await this.prisma.circleMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        circle: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                members: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m: any) => ({
      ...m.circle,
      userRole: m.role,
    }));
  }

  // ==================== D5: Circle Feed ====================

  async getCircleFeed(circleId: string, currentUserId: string) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId: currentUserId } },
      select: { role: true, status: true },
    });
    const isPatron = membership?.role === 'PATRON' || membership?.role === 'ADMIN';

    const posts = await (this.prisma as any).circleFeedPost.findMany({
      where: {
        circleId,
        ...(isPatron ? {} : { patronOnly: false }),
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    const postIds = posts.map((p: any) => p.id);
    const myLikes = postIds.length
      ? await this.prisma.circleFeedLike.findMany({
          where: { postId: { in: postIds }, userId: currentUserId },
          select: { postId: true },
        })
      : [];
    const likedPostIds = new Set(myLikes.map((l) => l.postId));

    return posts.map((p: any) => ({
      id: p.id,
      authorId: p.author.id,
      authorName: p.author.name,
      authorAvatar: p.author.avatar,
      authorRole: p.author.role,
      content: p.content,
      patronOnly: p.patronOnly,
      isPinned: p.isPinned,
      likes: p.likes,
      comments: p.commentCount,
      likedByMe: likedPostIds.has(p.id),
      createdAt: p.createdAt,
    }));
  }

  // Whole-app audit loose end: real like/comment backing for circle feed
  // posts (the buttons previously had no onClick at all, and `likes`/
  // `commentCount` were denormalized counters nothing ever wrote to).
  async toggleFeedPostLike(postId: string, userId: string) {
    const post = await this.prisma.circleFeedPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.circleFeedLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.circleFeedLike.delete({ where: { id: existing.id } }),
        this.prisma.circleFeedPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } }),
      ]);
      return { liked: false, likes: Math.max(0, post.likes - 1) };
    }

    await this.prisma.$transaction([
      this.prisma.circleFeedLike.create({ data: { postId, userId } }),
      this.prisma.circleFeedPost.update({ where: { id: postId }, data: { likes: { increment: 1 } } }),
    ]);
    return { liked: true, likes: post.likes + 1 };
  }

  async getFeedPostComments(postId: string) {
    const comments = await this.prisma.circleFeedComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
    return comments.map((c) => ({
      id: c.id,
      authorId: c.author.id,
      authorName: c.author.name,
      authorAvatar: c.author.avatar,
      content: c.content,
      createdAt: c.createdAt,
    }));
  }

  async addFeedPostComment(postId: string, authorId: string, content: string) {
    const post = await this.prisma.circleFeedPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId: post.circleId, userId: authorId } },
      select: { status: true },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be a member to comment in this circle');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.circleFeedComment.create({
        data: { postId, authorId, content },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.circleFeedPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);

    return {
      id: comment.id,
      authorId: comment.author.id,
      authorName: comment.author.name,
      authorAvatar: comment.author.avatar,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  async createCircleFeedPost(
    circleId: string,
    content: string,
    patronOnly: boolean,
    currentUser: CurrentUserPayload
  ) {
    const membership = await this.prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId: currentUser.id } },
      select: { role: true, status: true },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You must be a member to post in this circle');
    }

    if (patronOnly && membership.role !== 'PATRON' && membership.role !== 'ADMIN') {
      throw new ForbiddenException('Only patrons can create patron-only posts');
    }

    const crisisDetected = this.crisisDetection.detect(content);

    const post = await (this.prisma as any).circleFeedPost.create({
      data: {
        circleId,
        authorId: currentUser.id,
        content,
        patronOnly,
        hasCrisisSignal: crisisDetected,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    if (crisisDetected) {
      const circle = await this.prisma.circle.findUnique({
        where: { id: circleId },
        select: { name: true },
      });
      this.notifyAdminsOfCrisis(
        'Circle post flagged for welfare review',
        `A newly posted circle update in "${circle?.name || 'a circle'}" may contain a distress signal.`,
        { circleId, postId: post.id }
      );
    }

    return post;
  }
}
