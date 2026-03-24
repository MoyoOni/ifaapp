import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { EmailService } from '../notifications/email.service';

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagingGateway))
    private readonly messagingGateway: MessagingGateway,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  // ==================== Categories ====================

  // F9-602: Crisis keyword list for mental health detection
  private readonly CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'hurt myself',
    "can't go on", 'want to die', 'harm myself', 'no reason to live',
  ];

  private detectCrisis(content: string): boolean {
    const lower = content.toLowerCase();
    return this.CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private isSameUtcDay(a: Date, b: Date): boolean {
    return (
      a.getUTCFullYear() === b.getUTCFullYear()
      && a.getUTCMonth() === b.getUTCMonth()
      && a.getUTCDate() === b.getUTCDate()
    );
  }

  private async updateContributionStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        contributionStreak: true,
        lastContributionDate: true,
        longestStreak: true,
      },
    }).catch(() => null);

    if (!user) return;

    const now = new Date();
    const last = user.lastContributionDate;

    if (last && this.isSameUtcDay(last, now)) {
      return;
    }

    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const nextStreak =
      last && this.isSameUtcDay(last, yesterday)
        ? user.contributionStreak + 1
        : 1;
    const nextLongest = Math.max(user.longestStreak, nextStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        contributionStreak: nextStreak,
        longestStreak: nextLongest,
        lastContributionDate: now,
      },
    }).catch(() => {});
  }

  private async isFirstResponderReply(threadId: string, threadAuthorId: string, replierId: string): Promise<boolean> {
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
    this.ensureOduOfWeek().catch(() => {});

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
    'Ogbe', 'Oyeku', 'Iwori', 'Odi', 'Irosun', 'Owonrin',
    'Obara', 'Okanran', 'Ogunda', 'Osa', 'Ika', 'Oturupon',
    'Otura', 'Irete', 'Ose', 'Ofun',
  ];

  private getIsoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
      Owonrin: 'sudden change, divine disruption, and the trickster\'s gift',
      Obara: 'royalty, pride, generosity, and the wisdom of kings',
      Okanran: 'conflict, confrontation, and the courage to face truth',
      Ogunda: 'the forge, obstacles cleared, and the path made open',
      Osa: 'witchcraft, hidden enemies, and the protection of Ogun',
      Ika: 'character, integrity, and the consequences of one\'s choices',
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
        OR: [
          { lastPostAt: { gte: since } },
          { createdAt: { gte: since } },
        ],
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

  async findAllThreads(categoryId?: string, status?: string, tag?: string, currentUser?: CurrentUserPayload | null) {
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
      throw new ForbiddenException('This discussion contains sacred knowledge. Please sign in to participate respectfully.');
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

    // Check if teachings category - requires approval
    const isApproved = category.isTeachings
      ? false
      : dto.isApproved !== undefined
        ? dto.isApproved
        : true;

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
    await this.prisma.forumPost.create({
      data: {
        threadId: thread.id,
        authorId: currentUser.id,
        content: dto.content,
        status: PostStatus.ACTIVE,
      },
    });

    // Update category thread count
    await this.prisma.forumCategory.update({
      where: { id: dto.categoryId },
      data: { threadCount: { increment: 1 } },
    });

    // XP: +10 for creating a thread
    this.incrementXP(currentUser.id, 10).catch(() => {});
    this.updateContributionStreak(currentUser.id).catch(() => {});

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
    const crisisDetected = this.detectCrisis(dto.content);
    if (crisisDetected) {
      this.notifyAdmins(
        'Thread flagged for welfare review',
        `A newly created thread may contain a distress signal. Thread: "${thread.title}"`,
        { threadId: thread.id },
      );
    }

    return { ...thread, crisisDetected };
  }

  // ==================== F9-602 admin notification helper ====================

  private async notifyAdmins(title: string, message: string, data: Record<string, unknown>) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
        take: 5,
      });
      admins.forEach(({ id }) => {
        this.notificationService.createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title,
          message,
          data,
        }).catch(() => {});
      });
    } catch {
      // Non-blocking; never interrupt the user flow
    }
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
    this.incrementXP(post.authorId, 3).catch(() => {});

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

    const posts = await this.prisma.forumPost.findMany({
      where: {
        threadId,
        status: { not: PostStatus.DELETED },
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

    const isAdmin = currentUser?.role === 'ADMIN';

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

  async findPostById(id: string) {
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
        throw new BadRequestException('Anonymous posting is only available in the Seeker Questions category');
      }
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

    const isFirstResponder = await this.isFirstResponderReply(thread.id, thread.authorId, currentUser.id);

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
    this.incrementXP(currentUser.id, 5).catch(() => {});
    this.updateContributionStreak(currentUser.id).catch(() => {});
    if (thread.postCount + 1 === 20) {
      this.incrementXP(thread.authorId, 25).catch(() => {});
    }
    // +15 bonus for thread author when thread hits 100 views
    if (thread.viewCount >= 100 && thread.postCount + 1 === 1) {
      this.incrementXP(thread.authorId, 15).catch(() => {});
    }

    // Fire-and-forget: reply notifications + @mention notifications
    this.sendForumNotifications(post, thread, currentUser).catch(() => {});

    // F9-602: Crisis detection
    const crisisDetected = this.detectCrisis(dto.content);
    if (crisisDetected) {
      await this.prisma.forumPost.update({
        where: { id: post.id },
        data: { hasCrisisSignal: true },
      }).catch(() => {});
      this.notifyAdmins(
        'Post flagged for welfare review',
        `A forum post may contain a distress signal. Thread: "${thread.title}"`,
        { postId: post.id, threadId: thread.id },
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
          { userId: currentUser.id, threadId: thread.id },
        );
      }
    }

    return { ...post, crisisDetected, ...(rateLimitWarning && { rateLimitWarning }) };
  }

  // ==================== XP & Cultural Level ====================

  private readonly XP_THRESHOLDS: Array<{ level: string; xp: number }> = [
    { level: 'Omo Awo',  xp: 5000 },
    { level: 'Aremo',    xp: 1500 },
    { level: 'Oye',      xp: 500  },
    { level: 'Akeko',    xp: 100  },
    { level: 'Omo Ilé',  xp: 0    },
  ];

  private async incrementXP(userId: string, amount: number) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { rankXP: { increment: amount } },
      select: { rankXP: true, culturalLevel: true },
    }).catch(() => null);

    if (!updated) return;

    const newLevel = this.XP_THRESHOLDS.find((t) => updated.rankXP >= t.xp)?.level ?? 'Omo Ilé';
    if (newLevel !== updated.culturalLevel) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { culturalLevel: newLevel },
      }).catch(() => {});
    }
  }

  private async sendForumNotifications(
    post: { id: string; threadId: string; content: string; authorId: string },
    thread: { id: string; title: string; authorId: string },
    poster: CurrentUserPayload,
  ) {
    const posterName = (await this.prisma.user.findUnique({
      where: { id: poster.id },
      select: { name: true, yorubaName: true },
    }));
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
      this.notificationService.createNotification({
        userId,
        type: NotificationType.FORUM_REPLY,
        category: NotificationCategory.INFO,
        title: 'New reply in your discussion',
        message: `${displayName} replied to "${thread.title}"`,
        data: { threadId: thread.id, postId: post.id },
      }).catch(() => {});
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
        this.notificationService.createNotification({
          userId,
          type: NotificationType.MENTION,
          category: NotificationCategory.INFO,
          title: 'You were mentioned',
          message: `${displayName} mentioned you in "${thread.title}"`,
          data: { threadId: thread.id, postId: post.id },
        }).catch(() => {});
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

    // Update post
    return this.prisma.forumPost.update({
      where: { id },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
        status: PostStatus.EDITED,
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

    // Only author or admin can delete
    if (post.authorId !== currentUser.id && currentUser.role !== 'ADMIN') {
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
    currentUser: CurrentUserPayload,
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
    currentUser: CurrentUserPayload,
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
      await this.notificationService.createNotification({
        userId: report.post.authorId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.WARNING,
        title: action === 'ban_user' ? 'Account action taken' : 'Community guidelines reminder',
        message: action === 'ban_user'
          ? 'Your account has been restricted due to a community guideline violation.'
          : 'A moderator has reviewed a report about your post. Please review our community guidelines.',
        data: { postId: report.postId, threadId: report.post.threadId },
      }).catch(() => {});
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

    return bookmarks
      .filter((b) => b.thread.status !== 'DELETED')
      .map((b) => b.thread);
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

  // ==================== F9-701: Share Tracking ====================

  async trackThreadShare(_threadId: string) {
    // Optional analytics — count only, no user data stored
    return { tracked: true };
  }

  // ==================== F9-704: Related Products ====================

  async getRelatedProducts(threadId: string) {
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { title: true, content: true },
    });
    if (!thread) return [];

    // Extract unique keywords from thread title + first 300 chars of content
    const text = `${thread.title} ${thread.content.slice(0, 300)}`;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const keywords = [...new Set(words)];
    if (keywords.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: keywords.slice(0, 10).map((kw) => ({
          name: { contains: kw, mode: 'insensitive' as const },
        })),
      },
      take: 3,
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        images: true,
        category: true,
      },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      image: p.images[0] ?? null,
      category: p.category,
    }));
  }

  // ==================== F9-702: Forum Digest Email ====================

  async getDigestContent() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const threads = await this.prisma.forumThread.findMany({
      where: {
        isApproved: true,
        status: { not: 'DELETED' },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: [{ viewCount: 'desc' }, { postCount: 'desc' }],
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        postCount: true,
        author: { select: { name: true, yorubaName: true } },
        category: { select: { name: true } },
      },
    });

    const frontendUrl = process.env['FRONTEND_URL'] || 'https://iluase.com';
    return threads.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category.name,
      excerpt: t.content.slice(0, 200),
      postCount: t.postCount,
      authorName: t.author.yorubaName || t.author.name,
      threadUrl: `${frontendUrl}/forum/${t.id}`,
    }));
  }

  async sendForumDigest(triggeredBy: CurrentUserPayload) {
    if (triggeredBy.role !== 'ADMIN') {
      throw new ForbiddenException('Admin only');
    }

    const threads = await this.getDigestContent();
    if (threads.length === 0) {
      return { sent: 0, message: 'No trending threads this week.' };
    }

    // Get all opted-in users with email
    const users = await this.prisma.user.findMany({
      where: { forumDigestOptIn: true },
      select: { id: true, email: true, name: true, yorubaName: true },
      take: 500,
    });

    const subject = 'This week in Ìlú Àṣẹ — Dialogue ✦';
    let sent = 0;

    for (const u of users) {
      const displayName = u.yorubaName || u.name;
      const threadCards = threads.map((t) => `
        <div style="border:1px solid #e2d9c8;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8b7355;">${t.category}</p>
          <h3 style="margin:0 0 8px;font-size:16px;color:#2d1f0e;">${t.title}</h3>
          <p style="margin:0 0 12px;font-size:14px;color:#6b5a48;">${t.excerpt}…</p>
          <p style="margin:0 0 12px;font-size:12px;color:#a08060;">${t.postCount} replies · by ${t.authorName}</p>
          <a href="${t.threadUrl}" style="display:inline-block;padding:8px 20px;background:#c8973a;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">Join the dialogue →</a>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#fdf8f0;margin:0;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2d9c8;">
          <div style="background:#2d1f0e;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#c8973a;font-size:24px;">Ìlú Àṣẹ</h1>
            <p style="margin:8px 0 0;color:#a08060;font-size:14px;">Dialogue ✦ — Your weekly forum digest</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#6b5a48;margin:0 0 24px;">Ẹ káàárọ̀, ${displayName}. Here are the conversations shaping our community this week:</p>
            ${threadCards}
          </div>
          <div style="background:#fdf8f0;padding:16px 32px;border-top:1px solid #e2d9c8;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a08060;">
              You're receiving this because you're part of the Ìlú Àṣẹ community.<br>
              <a href="${process.env['FRONTEND_URL'] || 'https://iluase.com'}/settings" style="color:#c8973a;">Manage your preferences</a>
            </p>
          </div>
        </div>
        </body></html>
      `;

      try {
        await this.emailService.sendDirectEmail(u.email, subject, html);
        sent++;
      } catch {
        // non-blocking — continue for other users
      }
    }

    return { sent, total: users.length, threads: threads.length };
  }

  // ==================== F9-705: Micro-Tip ====================

  async tipPost(
    postId: string,
    amount: number,
    currency: string,
    currentUser: CurrentUserPayload,
  ) {
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
    await this.notificationService.createNotification({
      userId: post.authorId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'You received a tip! 🙏🏾',
      message: `Someone appreciated your forum post with a ${currency} ${amount.toLocaleString()} tip!`,
      data: { postId, tipId: tip.id },
    }).catch(() => {});

    return {
      success: true,
      tipId: tip.id,
      message: 'Àṣẹ! Your appreciation has been sent. 🙏🏾',
    };
  }

  // ==================== Admin Stats ====================

  async getForumStats() {
    const [totalThreads, totalPosts, totalCategories, openReports, totalAcknowledgments] =
      await Promise.all([
        this.prisma.forumThread.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.forumPost.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.forumCategory.count({ where: { isActive: true } }),
        this.prisma.forumReport.count({ where: { status: 'PENDING' } }),
        this.prisma.postAcknowledgment.count(),
      ]);

    // Active participants (users who posted in the last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPosters = await this.prisma.forumPost.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: 'DELETED' } },
      select: { authorId: true },
      distinct: ['authorId'],
    });

    return {
      totalThreads,
      totalPosts,
      totalCategories,
      openReports,
      totalAcknowledgments,
      activeParticipants7d: recentPosters.length,
    };
  }

  // ==================== F9-903: Detailed Forum Health Metrics ====================

  async getDetailedMetrics(period: '7d' | '30d' | '90d' = '7d') {
    const periodMs = { '7d': 7, '30d': 30, '90d': 90 }[period] * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - periodMs);

    const [
      newThreads,
      newPosts,
      activeUsers,
      engagementRate,
      acknowledges,
      topCategories,
      topAuthors,
    ] = await Promise.all([
      // New threads in period
      this.prisma.forumThread.count({
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
      }),
      // New posts in period
      this.prisma.forumPost.count({
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
      }),
      // Active users in period
      this.prisma.forumPost.findMany({
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
        select: { authorId: true },
        distinct: ['authorId'],
      }).then((p) => p.length),
      // Avg replies per thread
      this.prisma.forumThread.aggregate({
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
        _avg: { postCount: true },
      }).then((a) => a._avg.postCount || 0),
      // Total acknowledges
      this.prisma.postAcknowledgment.count({
        where: { createdAt: { gte: cutoff } },
      }),
      // Top 5 categories
      this.prisma.forumThread.groupBy({
        by: ['categoryId'],
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      // Top 5 authors
      this.prisma.forumPost.groupBy({
        by: ['authorId'],
        where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      period,
      newThreads,
      newPosts,
      activeUsers,
      avgRepliesPerThread: Math.round(engagementRate * 100) / 100,
      totalAcknowledges: acknowledges,
      topCategories,
      topAuthors,
      engagementRate: `${Math.round((acknowledges / (newPosts || 1)) * 100)}%`,
    };
  }

  // ==================== Search ====================

  async searchForum(q: string, currentUser: CurrentUserPayload | null = null) {
    if (!q || q.trim().length < 2) return { threads: [], posts: [] };

    const query = q.trim();
    const ilike = { contains: query, mode: 'insensitive' as const };

    const [threads, posts] = await Promise.all([
      this.prisma.forumThread.findMany({
        where: {
          isApproved: true,
          status: { not: 'DELETED' },
          // F9-601: Sacred threads hidden from unauthenticated users
          ...(!currentUser ? { isSacred: false } : {}),
          OR: [
            { title: ilike },
            { content: ilike },
            { tags: { has: query } },
          ],
        },
        orderBy: { lastPostAt: 'desc' },
        take: 10,
        include: {
          author: { select: { id: true, name: true, yorubaName: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.forumPost.findMany({
        where: {
          status: { not: 'DELETED' },
          isAnonymous: false,
          content: ilike,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          author: { select: { id: true, name: true, yorubaName: true, avatar: true } },
          thread: {
            select: {
              id: true,
              title: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return { threads, posts };
  }

  // ==================== F9-604: Elder Flags ====================

  async createElderFlag(postId: string, reason: string, currentUser: CurrentUserPayload) {
    // Only verified Babalawos can raise elder flags
    if (currentUser.role !== 'BABALAWO') {
      throw new ForbiddenException('Only Babalawos can raise elder flags');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { verified: true },
    });
    if (!user?.verified) {
      throw new ForbiddenException('Only verified Babalawos can raise elder flags');
    }

    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('Post not found');
    }

    const flag = await this.prisma.elderFlag.create({
      data: { postId, flaggedBy: currentUser.id, reason },
    });

    // Notify admins of the new cultural flag (fire-and-forget)
    this.notifyAdmins(
      'New Elder Flag raised',
      `A verified Babaláwo has flagged a post as culturally inaccurate`,
      { elderFlagId: flag.id, postId },
    );

    return { flagged: true, message: 'Your concern will be reviewed by our moderation team. This flag is not visible to the post author or community.' };
  }

  // ==================== F9-803: Elder Reactions ====================

  async reactToPost(postId: string, emoji: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'BABALAWO') {
      throw new ForbiddenException('Only Babalawos can use elder reactions');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { verified: true },
    });
    if (!user?.verified) {
      throw new ForbiddenException('Only verified Babalawos can use elder reactions');
    }

    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('Post not found');
    }

    const trimmedEmoji = emoji?.trim();
    if (!trimmedEmoji || trimmedEmoji.length > 16) {
      throw new BadRequestException('Invalid reaction emoji');
    }

    await this.prisma.elderReaction.upsert({
      where: { postId_userId: { postId, userId: currentUser.id } },
      create: { postId, userId: currentUser.id, emoji: trimmedEmoji },
      update: { emoji: trimmedEmoji },
    });

    return this.getPostElderReactions(postId);
  }

  async removeElderReaction(postId: string, currentUser: CurrentUserPayload) {
    await this.prisma.elderReaction.deleteMany({
      where: { postId, userId: currentUser.id },
    });
    return this.getPostElderReactions(postId);
  }

  async getPostElderReactions(postId: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.prisma.elderReaction.findMany({
      where: { postId },
      include: {
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
    });

    return reactions;
  }

  async getMyElderReactions(currentUser: CurrentUserPayload) {
    return this.prisma.elderReaction.findMany({
      where: { userId: currentUser.id },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            threadId: true,
            author: { select: { id: true, name: true, yorubaName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
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

  // ==================== F9-806: Live Sessions ====================

  async listLiveSessions(status?: string) {
    return this.prisma.liveSession.findMany({
      where: status ? { status } : {},
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createLiveSession(
    data: {
      title: string;
      hostIds: string[];
      scheduledAt: string;
      platform: string;
      externalUrl: string;
      preThreadId?: string;
    },
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admins only');
    }

    if (!data.title?.trim() || !data.platform?.trim() || !data.externalUrl?.trim()) {
      throw new BadRequestException('Missing required live session fields');
    }

    const scheduledAt = new Date(data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date');
    }

    if (data.preThreadId) {
      const thread = await this.prisma.forumThread.findUnique({
        where: { id: data.preThreadId },
        select: { id: true, status: true },
      });
      if (!thread || thread.status === 'DELETED') {
        throw new NotFoundException('Pre-session thread not found');
      }
    }

    const hostIds = Array.isArray(data.hostIds)
      ? [...new Set(data.hostIds.filter(Boolean))]
      : [];

    return this.prisma.liveSession.create({
      data: {
        title: data.title.trim(),
        hostIds,
        scheduledAt,
        platform: data.platform.trim(),
        externalUrl: data.externalUrl.trim(),
        preThreadId: data.preThreadId,
      },
    });
  }

  async updateLiveSessionStatus(id: string, status: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Admins only');
    }

    const allowed = new Set(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED']);
    if (!allowed.has(status)) {
      throw new BadRequestException('Invalid live session status');
    }

    const existing = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Live session not found');
    }

    return this.prisma.liveSession.update({
      where: { id },
      data: { status },
    });
  }

  async getElderFlags(currentUser: CurrentUserPayload, status = 'PENDING') {
    if (currentUser.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    return this.prisma.elderFlag.findMany({
      where: { status },
      include: {
        flagger: { select: { id: true, name: true, yorubaName: true, verified: true } },
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

  async reviewElderFlag(
    flagId: string,
    action: 'acknowledge' | 'remove_post' | 'request_edit' | 'dismiss',
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    const flag = await this.prisma.elderFlag.findUnique({
      where: { id: flagId },
      include: { post: { select: { id: true, authorId: true, threadId: true } } },
    });
    if (!flag) throw new NotFoundException('Elder flag not found');

    if (action === 'remove_post') {
      await this.prisma.forumPost.update({
        where: { id: flag.postId },
        data: { status: 'HIDDEN' },
      });
    }

    if (action === 'request_edit') {
      // Notify post author to revise their content
      await this.notificationService.createNotification({
        userId: flag.post.authorId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.WARNING,
        title: 'Request to revise your post',
        message: 'A community elder has raised a concern about the cultural accuracy of one of your posts. Please review and revise.',
        data: { postId: flag.postId, threadId: flag.post.threadId },
      }).catch(() => {});
    }

    return this.prisma.elderFlag.update({
      where: { id: flagId },
      data: { status: 'REVIEWED', reviewedBy: currentUser.id, reviewedAt: new Date() },
    });
  }
}
