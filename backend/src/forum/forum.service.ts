import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ThreadStatus, PostStatus } from '@ile-ase/common';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { NotificationService, NotificationType, NotificationCategory } from '../notifications/notification.service';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { ContentFlagMatcherService } from '../shared/services/content-flag-matcher.service';
import { UsersService } from '../users/users.service';
import { notifyForumAdmins } from './notify-forum-admins';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  // COMMUNITY_BACKLOG.md FOR-002: shared between the thread- and reply-
  // creation crisis-flagging blocks below so the reason text on
  // heldForReview posts is always identical, not two copies that could drift.
  // Statuses a moderator uses to take a post down; never shown to members.
  private static readonly REMOVED_STATUSES = [PostStatus.DELETED, PostStatus.HIDDEN, 'REJECTED'];

  private static readonly CRISIS_REVIEW_REASON =
    'Automatic crisis-keyword detection -- pending welfare review';

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
    private readonly notificationService: NotificationService,
    private readonly crisisDetection: CrisisDetectionService,
    private readonly usersService: UsersService,
    private readonly flagMatcher: ContentFlagMatcherService
  ) {}

  // ==================== Categories ====================

  private isSameUtcDay(a: Date, b: Date): boolean {
    return (
      a.getUTCFullYear() === b.getUTCFullYear() &&
      a.getUTCMonth() === b.getUTCMonth() &&
      a.getUTCDate() === b.getUTCDate()
    );
  }

  private async updateContributionStreak(userId: string) {
    const user = await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          contributionStreak: true,
          lastContributionDate: true,
          longestStreak: true,
        },
      })
      .catch(() => null);

    if (!user) return;

    const now = new Date();
    const last = user.lastContributionDate;

    if (last && this.isSameUtcDay(last, now)) {
      return;
    }

    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const nextStreak = last && this.isSameUtcDay(last, yesterday) ? user.contributionStreak + 1 : 1;
    const nextLongest = Math.max(user.longestStreak, nextStreak);

    await this.prisma.user
      .update({
        where: { id: userId },
        data: {
          contributionStreak: nextStreak,
          longestStreak: nextLongest,
          lastContributionDate: now,
        },
      })
      .catch((err) =>
        this.logger.error(`Failed to update contribution streak for user ${userId}`, err)
      );
  }

  private async isFirstResponderReply(
    threadId: string,
    threadAuthorId: string,
    replierId: string
  ): Promise<boolean> {
    if (replierId === threadAuthorId) return false;

    const existingReply = await this.prisma.forumPost.findFirst({
      where: {
        threadId,
        status: { not: PostStatus.DELETED },
        authorId: { not: threadAuthorId },
      },
      select: { id: true },
    });

    return !existingReply;
  }

  async findAllCategories() {
    // Lazily ensure this week's Odù of the Week thread exists
    this.ensureOduOfWeek().catch((err) =>
      this.logger.error('Failed to ensure Odù of the Week thread', err)
    );

    return this.prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { threads: true },
        },
      },
    });
  }

  async findCategoryBySlug(slug: string) {
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // COMMUNITY_BACKLOG.md FOR-Q3: "Ask an Elder" -- opted-in Babalawos shown
  // as social proof / response-time context on the Seeker Questions category
  async findEldersAnswering() {
    return this.prisma.user.findMany({
      where: { role: 'BABALAWO', answersElderQuestions: true },
      select: { id: true, name: true, yorubaName: true, avatar: true, trustScore: true },
      orderBy: { trustScore: 'desc' },
      take: 20,
    });
  }

  async createCategory(dto: CreateCategoryDto, currentUser: CurrentUserPayload) {
    // Only admins can create categories
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create categories');
    }

    return this.prisma.forumCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        order: dto.order || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isTeachings: dto.isTeachings || false,
      },
    });
  }

  // ==================== Odù of the Week ====================

  private readonly ODU_LIST = [
    'Ogbe',
    'Oyeku',
    'Iwori',
    'Odi',
    'Irosun',
    'Owonrin',
    'Obara',
    'Okanran',
    'Ogunda',
    'Osa',
    'Ika',
    'Oturupon',
    'Otura',
    'Irete',
    'Ose',
    'Ofun',
  ];

  private getIsoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  async ensureOduOfWeek() {
    const category = await this.prisma.forumCategory.findUnique({
      where: { slug: 'ifa-divination-studies' },
    });
    if (!category) return;

    const now = new Date();
    const weekNum = this.getIsoWeek(now);
    const year = now.getFullYear();
    const oduName = this.ODU_LIST[(weekNum - 1) % 16];
    const expectedTitle = `🔮 Odù of the Week: ${oduName} — Week ${weekNum}, ${year}`;

    // Check if this week's thread already exists
    const existing = await this.prisma.forumThread.findFirst({
      where: {
        categoryId: category.id,
        tags: { has: 'odu-of-week' },
        title: expectedTitle,
      },
    });
    if (existing) return;

    // Find an admin author — use env var or first admin
    const authorId = process.env.ODU_OF_WEEK_AUTHOR_ID;
    const author = authorId
      ? await this.prisma.user.findUnique({ where: { id: authorId }, select: { id: true } })
      : await this.prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });

    if (!author) return;

    const body = `Àṣẹ! This week we gather in the wisdom of **Odù ${oduName}**.

${oduName} carries teachings on ${this.getOduTheme(oduName)}.

**Questions for reflection this week:**
- What does ${oduName} reveal about your current path?
- Have you received any signs or dreams connected to this Odù?
- Elders and practitioners: what wisdom has ${oduName} brought to your work?

Share your reflections, questions, and experiences below. All levels welcome.

*Ẹ káàárọ̀, ẹ káàbọ̀ — Good morning, welcome.*`;

    await this.prisma.forumThread.create({
      data: {
        categoryId: category.id,
        authorId: author.id,
        title: expectedTitle,
        content: body,
        tags: ['odu-of-week', oduName.toLowerCase()],
        status: 'ACTIVE',
        isPinned: true,
        isApproved: true,
        postCount: 1,
      },
    });

    // Unpin previous week's odu-of-week thread
    await this.prisma.forumThread.updateMany({
      where: {
        categoryId: category.id,
        tags: { has: 'odu-of-week' },
        isPinned: true,
        NOT: { title: expectedTitle },
      },
      data: { isPinned: false },
    });
  }

  private getOduTheme(odu: string): string {
    const themes: Record<string, string> = {
      Ogbe: 'new beginnings, divine light, and the birth of all things',
      Oyeku: 'transformation, endings that birth new life, and ancestral wisdom',
      Iwori: 'inner sight, intuition, and the mirror of the soul',
      Odi: 'hidden things, the womb, and what gestates in darkness',
      Irosun: 'blood, lineage, sacrifice, and the price of growth',
      Owonrin: "sudden change, divine disruption, and the trickster's gift",
      Obara: 'royalty, pride, generosity, and the wisdom of kings',
      Okanran: 'conflict, confrontation, and the courage to face truth',
      Ogunda: 'the forge, obstacles cleared, and the path made open',
      Osa: 'witchcraft, hidden enemies, and the protection of Ogun',
      Ika: "character, integrity, and the consequences of one's choices",
      Oturupon: 'illness, healing, and the body as a spiritual vessel',
      Otura: 'the divine covenant, promises kept, and sacred oath',
      Irete: 'longevity, patience, and the fruit of sustained effort',
      Ose: 'prosperity, fertility, and the gifts of Oshun',
      Ofun: 'completion, death, rebirth, and the great cycle of Aye',
    };
    return themes[odu] ?? 'deep wisdom and ancestral guidance';
  }

  // ==================== Trending ====================

  async getTrendingThreads(limit = 5) {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const threads = await this.prisma.forumThread.findMany({
      where: {
        status: { not: 'DELETED' },
        isApproved: true,
        postCount: { gt: 0 },
        OR: [{ lastPostAt: { gte: since } }, { createdAt: { gte: since } }],
      },
      include: {
        author: {
          select: { id: true, name: true, yorubaName: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { posts: true } },
      },
      take: limit * 4, // over-fetch for scoring
    });

    const scored = threads
      .map((t) => ({ ...t, _score: t.postCount * 3 + t.viewCount * 0.5 }))
      .sort((a, b) => b._score - a._score);

    return scored.slice(0, limit);
  }

  // ==================== Threads ====================

  async findAllThreads(
    categoryId?: string,
    status?: string,
    tag?: string,
    currentUser?: CurrentUserPayload | null
  ) {
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'DELETED' }; // Don't show deleted threads
    }

    if (tag) {
      where.tags = { has: tag };
    }

    // Only show approved threads (unless admin)
    where.isApproved = true;

    // F9-601: Sacred threads are hidden from unauthenticated visitors
    if (!currentUser) {
      where.isSacred = false;
    }

    return this.prisma.forumThread.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { lastPostAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            role: true,
            subscriptionStatus: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        lastPoster: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  async findThreadById(id: string, currentUser?: CurrentUserPayload | null) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            role: true,
            subscriptionStatus: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isTeachings: true,
          },
        },
        lastPoster: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!thread || thread.status === 'DELETED') {
      throw new NotFoundException('Thread not found');
    }

    // F9-601: Sacred threads require authentication
    if ((thread as any).isSacred && !currentUser) {
      throw new ForbiddenException(
        'This discussion contains sacred knowledge. Please sign in to participate respectfully.'
      );
    }

    // Increment view count
    await this.prisma.forumThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return thread;
  }

  async createThread(dto: CreateThreadDto, currentUser: CurrentUserPayload) {
    // All authenticated users can start threads. Practitioners' Inner Circle requires BABALAWO role.
    // Monthly thread limit (THREAD_MONTHLY_LIMIT = 25) is intentionally disabled during platform growth phase.

    // Verify category exists
    const category = await this.prisma.forumCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException('Cannot create thread in inactive category');
    }

    // VENDOR_BACKLOG.md VND-019: Vendor Circle is vendor-only. Unlike
    // Practitioners' Inner Circle (frontend-hidden only, no backend check --
    // a pre-existing gap, not fixed here), this one is actually enforced,
    // since it can carry vendor pricing/sourcing detail.
    if (
      category.slug === 'vendor-circle' &&
      currentUser.role !== 'VENDOR' &&
      currentUser.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Vendor Circle is open to approved vendors only');
    }

    // Check if teachings category - requires approval
    const isApproved = category.isTeachings
      ? false
      : dto.isApproved !== undefined
        ? dto.isApproved
        : true;

    // COMMUNITY_BACKLOG.md FOR-014: "Elder-led discussion series and
    // teachings" -- a formal designation, Babalawo/Admin only, distinct from
    // a thread simply being authored by a Babalawo (already visible via the
    // existing author-role badge).
    if (dto.isTeachingSeries && currentUser.role !== 'BABALAWO' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only Babalawo can designate a thread as part of a teaching series'
      );
    }

    // Create thread
    const thread = await this.prisma.forumThread.create({
      data: {
        categoryId: dto.categoryId,
        authorId: currentUser.id,
        title: dto.title,
        content: dto.content,
        tags: dto.tags || [],
        status: ThreadStatus.ACTIVE,
        isApproved,
        isSacred: dto.isSacred ?? false,
        isTeachingSeries: dto.isTeachingSeries ?? false,
        seriesName: dto.isTeachingSeries ? dto.seriesName : undefined,
        postCount: 1, // First post is the thread content
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create first post (thread content)
    const firstPost = await this.prisma.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: currentUser.id,
        content: dto.content,
        status: PostStatus.ACTIVE,
        // FOR-001: published as normal; a match only queues it for review.
        flagMatch: await this.flagMatcher.match(`${dto.title}\n${dto.content}`, {
          categoryId: dto.categoryId,
        }),
      },
    });

    // Update category thread count
    await this.prisma.forumCategory.update({
      where: { id: dto.categoryId },
      data: { threadCount: { increment: 1 } },
    });

    // XP: +10 for creating a thread
    this.incrementXP(currentUser.id, 10).catch((err) =>
      this.logger.error(`Failed to increment XP for user ${currentUser.id} (create thread)`, err)
    );
    this.updateContributionStreak(currentUser.id).catch((err) =>
      this.logger.error(`Failed to update contribution streak for user ${currentUser.id}`, err)
    );

    // Check if this is a circle suggestion category
    const isCircleSuggestionCategory =
      category.slug === 'circle-suggestions' ||
      category.name.toLowerCase().includes('circle suggestion');

    if (isCircleSuggestionCategory) {
      // Create circle suggestion record
      await this.prisma.circleSuggestion.create({
        data: {
          suggestedBy: currentUser.id,
          threadId: thread.id,
          status: 'PENDING',
        },
      });
    }

    // F9-602: Crisis detection in thread content
    // Bug fix (COMMUNITY_BACKLOG.md FOR-002): the reply path already persists
    // hasCrisisSignal on the post it flags (see the reply-creation method
    // below), but this thread-creation path only fired the one-time admin
    // notification and never updated the post itself -- meaning a missed
    // notification meant the flag was gone for good, with nothing left in the
    // durable admin/forum/admin/crisis-signals queue to catch up on later.
    // A thread's very first post (someone opening a new thread to express
    // distress) is arguably the single most likely real-world case this
    // detector needs to catch, so this silently dropped the most important
    // half of the feature.
    const crisisDetected = this.crisisDetection.detect(dto.content);
    if (crisisDetected) {
      await this.prisma.forumPost
        .update({
          where: { id: firstPost.id },
          data: {
            hasCrisisSignal: true,
            heldForReview: true,
            reviewReason: ForumService.CRISIS_REVIEW_REASON,
          },
        })
        .catch((err) =>
          this.logger.error(`Failed to flag crisis signal on post ${firstPost.id}`, err)
        );
      this.notifyAdmins(
        'Thread flagged for welfare review',
        `A newly created thread may contain a distress signal. Thread: "${thread.title}"`,
        { threadId: thread.id, postId: firstPost.id }
      );
    }

    return { ...thread, crisisDetected };
  }

  // ==================== F9-602 admin notification helper ====================

  private async notifyAdmins(title: string, message: string, data: Record<string, unknown>) {
    await notifyForumAdmins(this.prisma, this.notificationService, this.logger, title, message, data);
  }

  async updateThread(id: string, dto: UpdateThreadDto, currentUser: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Only author or admin can update
    if (thread.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own threads');
    }

    // Update thread
    return this.prisma.forumThread.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
        ...(dto.isApproved !== undefined && { isApproved: dto.isApproved }),
        ...(dto.isSacred !== undefined && { isSacred: dto.isSacred }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async deleteThread(id: string, currentUser: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Only author or admin can delete
    if (thread.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own threads');
    }

    // Soft delete
    return this.prisma.forumThread.update({
      where: { id },
      data: { status: ThreadStatus.DELETED },
    });
  }

  // ==================== Posts ====================

  async acknowledgePost(postId: string, currentUser: CurrentUserPayload) {
    // Check if post exists
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already acknowledged
    const existingAcknowledgment = await this.prisma.postAcknowledgment.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUser.id,
        },
      },
    });

    if (existingAcknowledgment) {
      throw new BadRequestException('You have already acknowledged this post');
    }

    // Create acknowledgment and increment count
    await this.prisma.$transaction([
      this.prisma.postAcknowledgment.create({
        data: {
          postId,
          userId: currentUser.id,
        },
      }),
      this.prisma.forumPost.update({
        where: { id: postId },
        data: {
          acknowledgeCount: { increment: 1 },
        },
      }),
    ]);

    // XP: +3 for the post author receiving an acknowledgment
    this.incrementXP(post.authorId, 3).catch((err) =>
      this.logger.error(`Failed to increment XP for user ${post.authorId} (acknowledgment)`, err)
    );

    return { acknowledged: true, acknowledgeCount: post.acknowledgeCount + 1 };
  }

  async unacknowledgePost(postId: string, currentUser: CurrentUserPayload) {
    // Check if post exists
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if acknowledged
    const existingAcknowledgment = await this.prisma.postAcknowledgment.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: currentUser.id,
        },
      },
    });

    if (!existingAcknowledgment) {
      throw new BadRequestException('You have not acknowledged this post');
    }

    // Remove acknowledgment and decrement count (floor at 0)
    await this.prisma.$transaction([
      this.prisma.postAcknowledgment.delete({
        where: {
          postId_userId: {
            postId,
            userId: currentUser.id,
          },
        },
      }),
      this.prisma.forumPost.update({
        where: { id: postId, acknowledgeCount: { gt: 0 } },
        data: {
          acknowledgeCount: { decrement: 1 },
        },
      }),
    ]);

    return { acknowledged: false, acknowledgeCount: Math.max(0, post.acknowledgeCount - 1) };
  }

  async getPostAcknowledgments(postId: string) {
    const acknowledgments = await this.prisma.postAcknowledgment.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return acknowledgments.map((ack) => ack.user);
  }

  async findAllPosts(threadId: string, currentUser?: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.status === 'DELETED') {
      throw new NotFoundException('Thread not found');
    }

    const isAdmin = currentUser?.role === 'ADMIN';

    // COMMUNITY_BACKLOG.md FOR-002: a post automatically flagged by crisis
    // detection (see maybeFlagCrisisContent below) is also put on
    // heldForReview -- previously flagged content stayed fully visible to
    // everyone for the entire time it sat in the admin welfare-review queue.
    // Reuses the existing heldForReview/reviewReason columns (already on
    // ForumPost, previously written nowhere) rather than adding a second
    // visibility flag. The author can still see their own post (so it
    // doesn't just vanish on them mid-crisis), and admins see everything.
    const posts = await this.prisma.forumPost.findMany({
      where: {
        threadId,
        // Moderators hide a post with status HIDDEN (reports, elder flags) or
        // REJECTED (integrity queue). Until October 30, 2026 only DELETED was
        // filtered here, so hidden and rejected posts stayed visible to all.
        status: isAdmin ? { not: PostStatus.DELETED } : { notIn: ForumService.REMOVED_STATUSES },
        ...(isAdmin
          ? {}
          : {
              OR: [
                { heldForReview: false },
                ...(currentUser ? [{ authorId: currentUser.id }] : []),
              ],
            }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            role: true,
            subscriptionStatus: true,
            culturalLevel: true,
          },
        },
        elderReactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
            elder: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
                verified: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return posts.map((post) => {
      if (post.isAnonymous && !isAdmin && currentUser?.id !== post.authorId) {
        return {
          ...post,
          author: {
            id: 'anon',
            name: 'Anonymous Seeker',
            yorubaName: null,
            avatar: null,
            verified: false,
            role: null,
            subscriptionStatus: null,
            culturalLevel: null,
          },
        };
      }
      return post;
    });
  }

  async findPostById(id: string, currentUser?: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        thread: {
          select: {
            id: true,
            title: true,
            isLocked: true,
            status: true,
          },
        },
        elderReactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            createdAt: true,
            elder: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
                verified: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post || post.status === PostStatus.DELETED) {
      throw new NotFoundException('Post not found');
    }
    if (currentUser?.role !== 'ADMIN') {
      const removed = ForumService.REMOVED_STATUSES.includes(post.status);
      const heldFromViewer = post.heldForReview && post.authorId !== currentUser?.id;
      if (removed || heldFromViewer) throw new NotFoundException('Post not found');
    }

    return post;
  }

  async createPost(dto: CreatePostDto, currentUser: CurrentUserPayload) {
    // Verify thread exists and is not locked
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: dto.threadId },
      include: { category: { select: { slug: true } } },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.isLocked && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Cannot post in locked thread');
    }

    if (thread.status === 'DELETED') {
      throw new BadRequestException('Cannot post in deleted thread');
    }

    // Validate anonymous posting — only allowed in seeker-questions category
    if (dto.isAnonymous) {
      if (thread.category?.slug !== 'seeker-questions') {
        throw new BadRequestException(
          'Anonymous posting is only available in the Seeker Questions category'
        );
      }
    }

    // VENDOR_BACKLOG.md VND-019: same vendor-only gate as createThread
    if (
      thread.category?.slug === 'vendor-circle' &&
      currentUser.role !== 'VENDOR' &&
      currentUser.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Vendor Circle is open to approved vendors only');
    }

    // F9-902: Cultural Onboarding Gate — check BEFORE creating post
    const restrictedCategories = ['ifa-divination-studies', 'practitioners-inner-circle'];
    if (restrictedCategories.includes(thread.category?.slug ?? '')) {
      const poster = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { passedCulturalOrientation: true },
      });
      if (!poster?.passedCulturalOrientation) {
        throw new ForbiddenException({
          code: 'ORIENTATION_REQUIRED',
          message: 'Please complete a short cultural orientation before posting in this space.',
        });
      }
    }

    const isFirstResponder = await this.isFirstResponderReply(
      thread.id,
      thread.authorId,
      currentUser.id
    );

    // Create post
    const post = await this.prisma.forumPost.create({
      data: {
        threadId: dto.threadId,
        authorId: currentUser.id,
        content: dto.content,
        isAnonymous: dto.isAnonymous ?? false,
        postTag: dto.postTag,
        isFirstResponder,
        status: PostStatus.ACTIVE,
        flagMatch: await this.flagMatcher.match(dto.content, { categoryId: thread.categoryId }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });

    // Update thread post count and last post info
    await this.prisma.forumThread.update({
      where: { id: dto.threadId },
      data: {
        postCount: { increment: 1 },
        lastPostAt: new Date(),
        lastPostBy: currentUser.id,
      },
    });

    // Broadcast new post to all clients viewing this thread
    try {
      this.messagingGateway.server
        .to(`forum_thread:${post.threadId}`)
        .emit('forum:new_post', { threadId: post.threadId, post });
    } catch {
      // Non-blocking — socket emit failure should never break post creation
    }

    // XP: +5 for posting a reply; +25 bonus when thread hits 20 replies
    this.incrementXP(currentUser.id, 5).catch((err) =>
      this.logger.error(`Failed to increment XP for user ${currentUser.id} (reply)`, err)
    );
    this.updateContributionStreak(currentUser.id).catch((err) =>
      this.logger.error(`Failed to update contribution streak for user ${currentUser.id}`, err)
    );
    if (thread.postCount + 1 === 20) {
      this.incrementXP(thread.authorId, 25).catch((err) =>
        this.logger.error(
          `Failed to increment XP for user ${thread.authorId} (20-reply bonus)`,
          err
        )
      );
    }
    // +15 bonus for thread author when thread hits 100 views
    if (thread.viewCount >= 100 && thread.postCount + 1 === 1) {
      this.incrementXP(thread.authorId, 15).catch((err) =>
        this.logger.error(
          `Failed to increment XP for user ${thread.authorId} (100-view bonus)`,
          err
        )
      );
    }

    // Fire-and-forget: reply notifications + @mention notifications
    this.sendForumNotifications(post, thread, currentUser).catch((err) =>
      this.logger.error(`Failed to send forum notifications for post ${post.id}`, err)
    );

    // F9-602: Crisis detection
    const crisisDetected = this.crisisDetection.detect(dto.content);
    if (crisisDetected) {
      await this.prisma.forumPost
        .update({
          where: { id: post.id },
          data: {
            hasCrisisSignal: true,
            heldForReview: true,
            reviewReason: ForumService.CRISIS_REVIEW_REASON,
          },
        })
        .catch((err) => this.logger.error(`Failed to flag crisis signal on post ${post.id}`, err));
      this.notifyAdmins(
        'Post flagged for welfare review',
        `A forum post may contain a distress signal. Thread: "${thread.title}"`,
        { postId: post.id, threadId: thread.id }
      );
    }

    // F9-606: Rate-limit soft warning in healing-herbs-wellness category
    let rateLimitWarning = false;
    if (thread.category?.slug === 'healing-herbs-wellness') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await this.prisma.forumPost.count({
        where: {
          authorId: currentUser.id,
          thread: { categoryId: thread.categoryId },
          createdAt: { gte: since },
        },
      });
      if (recentCount > 5) {
        rateLimitWarning = true;
        this.notifyAdmins(
          'High-volume healing post activity',
          `User ${currentUser.id} has posted more than 5 times in Healing & Herbs category in 24h`,
          { userId: currentUser.id, threadId: thread.id }
        );
      }
    }

    return { ...post, crisisDetected, ...(rateLimitWarning && { rateLimitWarning }) };
  }

  // ==================== XP & Cultural Level ====================

  // V8-305: this used to be a second, independent XP system -- own
  // `rankXP { increment }` write, own culturalLevel threshold table (with
  // different level *names* than users.service.ts's: "Omo Awo"/"Aremo"/
  // "Oye"/"Akeko" here vs. "Awo Agba"/"Awo"/"Akọ̀wé"/"Ẹ̀kọ́ Jinlẹ̀"/"Ẹ̀kọ́"/
  // "Ọmọ Ilé Tuntun" there), and critically no Devoted 2× multiplier at all.
  // Both wrote the same `user.culturalLevel` field, so whichever XP source
  // fired most recently silently overwrote the other's level name on the
  // user's profile. Delegating to the one real implementation
  // (UsersService.awardXP) fixes both problems at once.
  private async incrementXP(userId: string, amount: number) {
    await this.usersService.awardXP(userId, amount);
  }

  private async sendForumNotifications(
    post: { id: string; threadId: string; content: string; authorId: string },
    thread: { id: string; title: string; authorId: string },
    poster: CurrentUserPayload
  ) {
    const posterName = await this.prisma.user.findUnique({
      where: { id: poster.id },
      select: { name: true, yorubaName: true },
    });
    const displayName = posterName?.yorubaName ?? posterName?.name ?? 'A community member';

    // ── F9-301: Collect FORUM_REPLY recipients ────────────────────────────────
    const previousPosterIds = await this.prisma.forumPost.findMany({
      where: { threadId: thread.id, authorId: { not: poster.id } },
      select: { authorId: true },
      distinct: ['authorId'],
    });

    const recipientIds = new Set<string>(previousPosterIds.map((p) => p.authorId));
    if (thread.authorId !== poster.id) recipientIds.add(thread.authorId);

    recipientIds.forEach((userId) => {
      this.notificationService
        .createNotification({
          userId,
          type: NotificationType.FORUM_REPLY,
          category: NotificationCategory.INFO,
          title: 'New reply in your discussion',
          message: `${displayName} replied to "${thread.title}"`,
          data: { threadId: thread.id, postId: post.id },
        })
        .catch((err) =>
          this.logger.error(`Failed to send reply notification to user ${userId}`, err)
        );
    });

    // ── F9-302: Parse @mentions ───────────────────────────────────────────────
    const mentionPattern = /@([\w\u00C0-\u024F\u1E00-\u1EFF]+)/g;
    const handles = [...post.content.matchAll(mentionPattern)].map((m) => m[1]).slice(0, 5);

    if (handles.length > 0) {
      const mentionedUsers = await this.prisma.user.findMany({
        where: {
          OR: handles.flatMap((h) => [
            { name: { equals: h, mode: 'insensitive' } },
            { yorubaName: { equals: h, mode: 'insensitive' } },
          ]),
          id: { not: poster.id },
        },
        select: { id: true },
      });

      mentionedUsers.forEach(({ id: userId }) => {
        this.notificationService
          .createNotification({
            userId,
            type: NotificationType.MENTION,
            category: NotificationCategory.INFO,
            title: 'You were mentioned',
            message: `${displayName} mentioned you in "${thread.title}"`,
            data: { threadId: thread.id, postId: post.id },
          })
          .catch((err) =>
            this.logger.error(`Failed to send mention notification to user ${userId}`, err)
          );
      });
    }
  }

  async updatePost(id: string, dto: UpdatePostDto, currentUser: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Only author or admin can update
    if (post.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own posts');
    }
    // Editing used to set status EDITED unconditionally, which put a post a
    // moderator had hidden or rejected straight back on the page.
    if (ForumService.REMOVED_STATUSES.includes(post.status)) {
      throw new NotFoundException('Post not found');
    }

    // FOR-001: an edit can turn a clean post into one that matches a rule.
    const flagMatch = dto.content ? await this.flagMatcher.match(dto.content) : null;
    const newlyFlagged = !!flagMatch && flagMatch !== post.flagMatch;

    // Update post
    return this.prisma.forumPost.update({
      where: { id },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
        status: PostStatus.EDITED,
        ...(newlyFlagged ? { flagMatch, flagReviewedAt: null, flagReviewedBy: null } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });
  }

  async deletePost(id: string, currentUser: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Author can always delete their own post. A non-author needs to be an
    // admin with the MODERATOR or SUPER sub-role -- a bootstrap/legacy admin
    // with no sub-role assigned yet also passes, matching RolesGuard's own
    // convention (see auth/guards/roles.guard.ts).
    const isOwner = post.authorId === currentUser.id;
    const isModerator =
      currentUser.role === 'ADMIN' &&
      (!currentUser.adminSubRole ||
        currentUser.adminSubRole === 'MODERATOR' ||
        currentUser.adminSubRole === 'SUPER');
    if (!isOwner && !isModerator) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Soft delete
    const deletedPost = await this.prisma.forumPost.update({
      where: { id },
      data: { status: PostStatus.DELETED },
    });

    // Update thread post count
    await this.prisma.forumThread.update({
      where: { id: post.threadId },
      data: { postCount: { decrement: 1 } },
    });

    return deletedPost;
  }

  // ==================== Reports ====================

  async reportPost(
    postId: string,
    reason: string,
    note: string | undefined,
    currentUser: CurrentUserPayload
  ) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post || post.status === 'DELETED') throw new NotFoundException('Post not found');

    try {
      await this.prisma.forumReport.create({
        data: { reporterId: currentUser.id, postId, reason, note },
      });
    } catch {
      throw new BadRequestException('You have already reported this post');
    }

    return { reported: true };
  }

  async getReports(currentUser: CurrentUserPayload, status = 'PENDING') {
    if (currentUser.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    return this.prisma.forumReport.findMany({
      where: { status },
      include: {
        reporter: { select: { id: true, name: true, yorubaName: true, avatar: true } },
        post: {
          include: {
            author: { select: { id: true, name: true, yorubaName: true } },
            thread: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewReport(
    reportId: string,
    action: 'dismiss' | 'hide_post' | 'warn_user' | 'ban_user',
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    const report = await this.prisma.forumReport.findUnique({
      where: { id: reportId },
      include: { post: { select: { authorId: true, threadId: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (action === 'hide_post') {
      await this.prisma.forumPost.update({
        where: { id: report.postId },
        data: { status: 'HIDDEN' },
      });
    }

    if (action === 'warn_user' || action === 'ban_user') {
      await this.notificationService
        .createNotification({
          userId: report.post.authorId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title: action === 'ban_user' ? 'Account action taken' : 'Community guidelines reminder',
          message:
            action === 'ban_user'
              ? 'Your account has been restricted due to a community guideline violation.'
              : 'A moderator has reviewed a report about your post. Please review our community guidelines.',
          data: { postId: report.postId, threadId: report.post.threadId },
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify user ${report.post.authorId} of moderation action (${action})`,
            err
          )
        );
    }

    return this.prisma.forumReport.update({
      where: { id: reportId },
      data: {
        status: 'REVIEWED',
        action,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
      },
    });
  }

  // ==================== Bookmarks ====================

  async bookmarkThread(threadId: string, currentUser: CurrentUserPayload) {
    const thread = await this.prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread || thread.status === 'DELETED') {
      throw new NotFoundException('Thread not found');
    }

    await this.prisma.forumBookmark.upsert({
      where: { userId_threadId: { userId: currentUser.id, threadId } },
      update: {},
      create: { userId: currentUser.id, threadId },
    });

    return { bookmarked: true };
  }

  async unbookmarkThread(threadId: string, currentUser: CurrentUserPayload) {
    await this.prisma.forumBookmark.deleteMany({
      where: { userId: currentUser.id, threadId },
    });
    return { bookmarked: false };
  }

  async getBookmarkStatus(threadId: string, currentUser: CurrentUserPayload) {
    const bookmark = await this.prisma.forumBookmark.findUnique({
      where: { userId_threadId: { userId: currentUser.id, threadId } },
    });
    return { bookmarked: !!bookmark };
  }

  async getBookmarkedThreads(currentUser: CurrentUserPayload) {
    const bookmarks = await this.prisma.forumBookmark.findMany({
      where: { userId: currentUser.id },
      include: {
        thread: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                yorubaName: true,
                avatar: true,
                verified: true,
                role: true,
                subscriptionStatus: true,
                culturalLevel: true,
              },
            },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { posts: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.filter((b) => b.thread.status !== 'DELETED').map((b) => b.thread);
  }

  // ==================== Subscriptions ====================

  async subscribeThread(threadId: string, currentUser: CurrentUserPayload) {
    await this.prisma.forumSubscription.upsert({
      where: { userId_threadId: { userId: currentUser.id, threadId } },
      create: { userId: currentUser.id, threadId },
      update: {},
    });
    return { subscribed: true };
  }

  async unsubscribeThread(threadId: string, currentUser: CurrentUserPayload) {
    await this.prisma.forumSubscription.deleteMany({
      where: { userId: currentUser.id, threadId },
    });
    return { subscribed: false };
  }

  async getSubscriptionStatus(threadId: string, currentUser: CurrentUserPayload) {
    const sub = await this.prisma.forumSubscription.findUnique({
      where: { userId_threadId: { userId: currentUser.id, threadId } },
    });
    return { subscribed: !!sub };
  }

  // ==================== Moderation ====================

  async moderateThread(
    id: string,
    action: 'approve' | 'lock' | 'unlock' | 'pin' | 'unpin',
    currentUser: CurrentUserPayload
  ) {
    // Only admins can moderate
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can moderate threads');
    }

    const thread = await this.prisma.forumThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const updateData: Partial<{
      isApproved: boolean;
      isLocked: boolean;
      isPinned: boolean;
    }> = {};

    switch (action) {
      case 'approve':
        updateData.isApproved = true;
        break;
      case 'lock':
        updateData.isLocked = true;
        break;
      case 'unlock':
        updateData.isLocked = false;
        break;
      case 'pin':
        updateData.isPinned = true;
        break;
      case 'unpin':
        updateData.isPinned = false;
        break;
    }

    return this.prisma.forumThread.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
            verified: true,
            culturalLevel: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // ==================== F9-705: Micro-Tip ====================

  async tipPost(postId: string, amount: number, currency: string, currentUser: CurrentUserPayload) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Tip amount must be greater than zero');
    }

    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, isAnonymous: true, status: true },
    });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId === currentUser.id) {
      throw new BadRequestException('You cannot tip your own post');
    }
    if (post.isAnonymous) {
      throw new BadRequestException('Cannot tip an anonymous post');
    }

    // Credit author wallet (upsert to handle missing wallet)
    await this.prisma.wallet.upsert({
      where: { userId: post.authorId },
      create: { userId: post.authorId, balance: amount, currency },
      update: { balance: { increment: amount } },
    });

    // Record the tip
    const tip = await this.prisma.forumTip.create({
      data: {
        postId,
        fromUserId: currentUser.id,
        toUserId: post.authorId,
        amount,
        currency,
        status: 'COMPLETED',
      },
    });

    // Notify the author
    await this.notificationService
      .createNotification({
        userId: post.authorId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'You received a tip! 🙏🏾',
        message: `Someone appreciated your forum post with a ${currency} ${amount.toLocaleString()} tip!`,
        data: { postId, tipId: tip.id },
      })
      .catch((err) =>
        this.logger.error(`Failed to notify user ${post.authorId} of received tip ${tip.id}`, err)
      );

    return {
      success: true,
      tipId: tip.id,
      message: 'Àṣẹ! Your appreciation has been sent. 🙏🏾',
    };
  }

  // ==================== F9-802: Contribution Streak ====================

  async getContributionStreak(currentUser: CurrentUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        contributionStreak: true,
        longestStreak: true,
        lastContributionDate: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

}
