import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ThreadStatus } from '@ile-ase/common';

// Split out of ForumService (October 30, 2026), methods moved verbatim.
// Admin forum management (categories, moving/merging/featuring/deleting threads) and forum statistics.
@Injectable()
export class ForumAdminService {
  private readonly logger = new Logger(ForumAdminService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== Admin Forum Management ====================

  async createForumCategory(
    data: {
      name: string;
      description?: string;
      icon?: string;
      order?: number;
      isTeachings?: boolean;
    },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create forum categories');
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    return this.prisma.forumCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        order: data.order || 0,
        isTeachings: data.isTeachings || false,
        isActive: true,
      },
    });
  }

  async updateForumCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      order?: number;
      isTeachings?: boolean;
      isActive?: boolean;
    },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update forum categories');
    }

    // If name is changing, update the slug
    let slug = undefined;
    if (data.name) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    }

    return this.prisma.forumCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isTeachings !== undefined && { isTeachings: data.isTeachings }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteForumCategory(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete forum categories');
    }

    // Check if category has threads
    const threadCount = await this.prisma.forumThread.count({
      where: { categoryId: id },
    });

    if (threadCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing threads. Move threads to another category first.'
      );
    }

    return this.prisma.forumCategory.delete({
      where: { id },
    });
  }

  async reorderForumCategory(id: string, newPosition: number, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reorder forum categories');
    }

    return this.prisma.forumCategory.update({
      where: { id },
      data: { order: newPosition },
    });
  }

  async moveThreadToCategory(
    threadId: string,
    targetCategoryId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can move threads between categories');
    }

    // Verify thread exists
    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Verify target category exists and is active
    const category = await this.prisma.forumCategory.findFirst({
      where: {
        id: targetCategoryId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Target category not found or inactive');
    }

    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { categoryId: targetCategoryId },
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

  async featureThread(threadId: string, isFeatured: boolean, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can feature threads');
    }

    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: isFeatured }, // Using isPinned for now, could extend with isFeatured later
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

  async mergeThreads(
    primaryThreadId: string,
    secondaryThreadId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can merge threads');
    }

    // Verify both threads exist
    const [primaryThread, secondaryThread] = await Promise.all([
      this.prisma.forumThread.findUnique({ where: { id: primaryThreadId } }),
      this.prisma.forumThread.findUnique({ where: { id: secondaryThreadId } }),
    ]);

    if (!primaryThread) {
      throw new NotFoundException('Primary thread not found');
    }

    if (!secondaryThread) {
      throw new NotFoundException('Secondary thread not found');
    }

    if (primaryThread.categoryId !== secondaryThread.categoryId) {
      throw new BadRequestException('Cannot merge threads from different categories');
    }

    // Move all posts from secondary thread to primary thread
    await this.prisma.forumPost.updateMany({
      where: { threadId: secondaryThreadId },
      data: { threadId: primaryThreadId },
    });

    // Update the primary thread's post count and last post info
    const posts = await this.prisma.forumPost.findMany({
      where: { threadId: primaryThreadId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const postCount = await this.prisma.forumPost.count({
      where: { threadId: primaryThreadId },
    });

    await this.prisma.forumThread.update({
      where: { id: primaryThreadId },
      data: {
        postCount,
        lastPostAt: posts[0]?.createdAt,
        lastPostBy: posts[0]?.authorId,
      },
    });

    // Soft delete the secondary thread (P0-03) — mirrors the existing
    // deleteThread() convention (status: DELETED) instead of a hard delete,
    // which would permanently destroy the thread and cascade-delete its
    // posts with no recovery path if the merge turns out to be a mistake.
    await this.prisma.forumThread.update({
      where: { id: secondaryThreadId },
      data: { status: ThreadStatus.DELETED },
    });

    // Return the updated primary thread
    return this.prisma.forumThread.findUnique({
      where: { id: primaryThreadId },
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

  async deleteThreadForAdmin(threadId: string, currentUser: CurrentUserPayload, reason?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete threads');
    }

    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Log the deletion with reason if provided
    // In a real implementation, we might want to store this in an audit log
    if (reason) {
      this.logger.log(
        `Thread ${threadId} deleted by admin ${currentUser.id} for reason: ${reason}`
      );
    }

    // Soft delete (P0-03) — matches deleteThread()'s existing convention.
    // This used to hard-delete the thread (and cascade-delete every post in
    // it) with no recovery path, even for a mistaken or disputed moderation
    // action.
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { status: ThreadStatus.DELETED },
    });
  }

  async adminDeleteThread(threadId: string, currentUser: CurrentUserPayload, reason?: string) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can delete threads');
    }

    const thread = await this.prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Log the deletion with reason if provided
    // In a real implementation, we might want to store this in an audit log
    if (reason) {
      this.logger.log(
        `Thread ${threadId} deleted by admin ${currentUser.id} for reason: ${reason}`
      );
    }

    // Soft delete (P0-03) — matches deleteThread()'s existing convention.
    // This used to hard-delete the thread (and cascade-delete every post in
    // it) with no recovery path, even for a mistaken or disputed moderation
    // action.
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { status: ThreadStatus.DELETED },
    });
  }

  async getAllForumCategories() {
    return this.prisma.forumCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getForumManagementStats() {
    const [totalCategories, totalThreads, totalPosts, lockedThreads, pinnedThreads] =
      await Promise.all([
        this.prisma.forumCategory.count(),
        this.prisma.forumThread.count(),
        this.prisma.forumPost.count(),
        this.prisma.forumThread.count({ where: { isLocked: true } }),
        this.prisma.forumThread.count({ where: { isPinned: true } }),
      ]);

    return {
      totalCategories,
      totalThreads,
      totalPosts,
      lockedThreads,
      pinnedThreads,
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
      this.prisma.forumPost
        .findMany({
          where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
          select: { authorId: true },
          distinct: ['authorId'],
        })
        .then((p) => p.length),
      // Avg replies per thread
      this.prisma.forumThread
        .aggregate({
          where: { createdAt: { gte: cutoff }, status: { not: 'DELETED' } },
          _avg: { postCount: true },
        })
        .then((a) => a._avg.postCount || 0),
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
}
