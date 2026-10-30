import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RejectPostDto } from './dto/reject-post.dto';
import { CreateFlagRuleDto } from './dto/create-flag-rule.dto';
import { UpdateFlagRuleDto } from './dto/update-flag-rule.dto';
import { AuditService } from './audit.service';
import { ContentFlagMatcherService } from '../shared/services/content-flag-matcher.service';

@Injectable()
export class AdminIntegrityService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private flagMatcher: ContentFlagMatcherService
  ) {}

  // ===== Review Queue =====

  // Crisis-flagged posts are held too, but they're handled in the crisis
  // queue (forum.service.ts resolveCrisisSignal, which also lifts the hold).
  // Listing them here as well double-counted them in the morning brief and let
  // a moderator reject a distress post with no welfare follow-up.
  private static readonly QUEUE_WHERE = { heldForReview: true, hasCrisisSignal: false };

  async getQueue(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where: AdminIntegrityService.QUEUE_WHERE,
        include: {
          author: {
            select: { id: true, name: true, email: true, avatar: true, culturalLevel: true },
          },
          thread: {
            select: { id: true, title: true, category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.forumPost.count({ where: AdminIntegrityService.QUEUE_WHERE }),
    ]);

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async approvePost(postId: string, admin: CurrentUserPayload) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.heldForReview) throw new BadRequestException('Post is not held for review');
    if (post.hasCrisisSignal) {
      throw new BadRequestException('This post is a crisis flag. Handle it in Crisis Alerts.');
    }

    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        heldForReview: false,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });
  }

  async rejectPost(postId: string, admin: CurrentUserPayload, dto: RejectPostDto) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (!post.heldForReview) throw new BadRequestException('Post is not held for review');
    if (post.hasCrisisSignal) {
      throw new BadRequestException('This post is a crisis flag. Handle it in Crisis Alerts.');
    }

    // Set heldForReview: false and mark status as REJECTED
    // The reason is not stored in the post, but could be sent via notification later.
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        heldForReview: false,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        status: 'REJECTED',
      },
    });
  }

  // ===== Rule matches (FOR-001) =====

  // Posts that matched a ContentFlagRule. Unlike the held queue above these
  // are live on the site (owner's "publish and flag" decision); an admin
  // either clears the flag or hides the post.
  private static readonly FORUM_FLAGGED_WHERE = {
    flagMatch: { not: null },
    flagReviewedAt: null,
    status: { notIn: ['DELETED', 'HIDDEN', 'REJECTED'] },
  };
  private static readonly CIRCLE_FLAGGED_WHERE = {
    flagMatch: { not: null },
    flagReviewedAt: null,
    status: 'VISIBLE',
  };

  async countFlagged(): Promise<number> {
    const [forum, circle] = await Promise.all([
      this.prisma.forumPost.count({ where: AdminIntegrityService.FORUM_FLAGGED_WHERE }),
      this.prisma.circleFeedPost.count({ where: AdminIntegrityService.CIRCLE_FLAGGED_WHERE }),
    ]);
    return forum + circle;
  }

  async getFlagged(limit = 100) {
    const author = { select: { id: true, name: true, avatar: true } };
    const [forum, circle, total] = await Promise.all([
      this.prisma.forumPost.findMany({
        where: AdminIntegrityService.FORUM_FLAGGED_WHERE,
        include: { author, thread: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
      this.prisma.circleFeedPost.findMany({
        where: AdminIntegrityService.CIRCLE_FLAGGED_WHERE,
        include: { author, circle: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
      this.countFlagged(),
    ]);
    const items = [
      ...forum.map((p) => ({
        source: 'forum' as const,
        id: p.id,
        content: p.content,
        flagMatch: p.flagMatch,
        createdAt: p.createdAt,
        author: p.author,
        where: { id: p.thread.id, title: p.thread.title },
      })),
      ...circle.map((p) => ({
        source: 'circle' as const,
        id: p.id,
        content: p.content,
        flagMatch: p.flagMatch,
        createdAt: p.createdAt,
        author: p.author,
        where: { id: p.circle.id, title: p.circle.name },
      })),
    ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return { items, total };
  }

  async resolveFlagged(
    source: string,
    postId: string,
    action: 'clear' | 'hide',
    admin: CurrentUserPayload
  ) {
    const reviewed = { flagReviewedAt: new Date(), flagReviewedBy: admin.id };
    if (source === 'forum') {
      const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
      if (!post || !post.flagMatch) throw new NotFoundException('Flagged post not found');
      return this.prisma.forumPost.update({
        where: { id: postId },
        data: { ...reviewed, ...(action === 'hide' ? { status: 'HIDDEN' } : {}) },
      });
    }
    if (source === 'circle') {
      const post = await this.prisma.circleFeedPost.findUnique({ where: { id: postId } });
      if (!post || !post.flagMatch) throw new NotFoundException('Flagged post not found');
      return this.prisma.circleFeedPost.update({
        where: { id: postId },
        data: { ...reviewed, ...(action === 'hide' ? { status: 'HIDDEN' } : {}) },
      });
    }
    throw new BadRequestException('source must be forum or circle');
  }

  // ===== Flag Rules =====

  async getRules() {
    return this.prisma.contentFlagRule.findMany({
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(dto: CreateFlagRuleDto, admin: CurrentUserPayload) {
    this.flagMatcher.invalidate();
    return this.prisma.contentFlagRule.create({
      data: {
        type: dto.type,
        value: dto.value,
        reason: dto.reason,
        createdBy: admin.id,
      },
    });
  }

  async updateRule(id: string, dto: UpdateFlagRuleDto) {
    const rule = await this.prisma.contentFlagRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Flag rule not found');

    this.flagMatcher.invalidate();
    return this.prisma.contentFlagRule.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
  }

  async deleteRule(id: string, currentUser: CurrentUserPayload) {
    const rule = await this.prisma.contentFlagRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Flag rule not found');
    const deleted = await this.prisma.contentFlagRule.delete({ where: { id } });
    this.flagMatcher.invalidate();

    // P0-03: real queryable audit trail for hard deletes, not just a log line.
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'DELETE',
      entityType: 'ContentFlagRule',
      entityId: id,
      payload: { snapshot: deleted },
    });

    return deleted;
  }
}
