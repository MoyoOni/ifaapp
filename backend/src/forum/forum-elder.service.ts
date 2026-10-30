import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { notifyForumAdmins } from './notify-forum-admins';

// Split out of ForumService (October 30, 2026), methods moved verbatim.
// Elder tools: elder flags and their review, elder reactions, and live sessions.
@Injectable()
export class ForumElderService {
  private readonly logger = new Logger(ForumElderService.name);

  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

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
    notifyForumAdmins(
      this.prisma,
      this.notificationService,
      this.logger,
      'New Elder Flag raised',
      `A verified Babaláwo has flagged a post as culturally inaccurate`,
      { elderFlagId: flag.id, postId }
    );

    return {
      flagged: true,
      message:
        'Your concern will be reviewed by our moderation team. This flag is not visible to the post author or community.',
    };
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
    currentUser: CurrentUserPayload
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

    const hostIds = Array.isArray(data.hostIds) ? [...new Set(data.hostIds.filter(Boolean))] : [];

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

  // The Elder Oversight panel's "My Flags" tab used to call getElderFlags
  // below -- the admin moderation queue -- and filter client-side, which 403'd
  // for every babalawo, so the tab never loaded. This returns only the
  // caller's own flags, in every status, so they can follow each one through.
  async getMyElderFlags(currentUser: CurrentUserPayload) {
    return this.prisma.elderFlag.findMany({
      where: { flaggedBy: currentUser.id },
      include: {
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
    currentUser: CurrentUserPayload
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
      await this.notificationService
        .createNotification({
          userId: flag.post.authorId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title: 'Request to revise your post',
          message:
            'A community elder has raised a concern about the cultural accuracy of one of your posts. Please review and revise.',
          data: { postId: flag.postId, threadId: flag.post.threadId },
        })
        .catch((err) =>
          this.logger.error(
            `Failed to notify user ${flag.post.authorId} of elder edit request`,
            err
          )
        );
    }

    return this.prisma.elderFlag.update({
      where: { id: flagId },
      data: { status: 'REVIEWED', reviewedBy: currentUser.id, reviewedAt: new Date() },
    });
  }
}
