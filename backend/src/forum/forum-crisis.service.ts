import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResolveCrisisSignalDto } from './dto/crisis-follow-up.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

// Split out of ForumService (October 30, 2026), methods moved verbatim.
// Crisis signals: the admin crisis queue, claiming, resolving and the follow-up history (Z1-803).
@Injectable()
export class ForumCrisisService {
  constructor(private prisma: PrismaService) {}

  // ==================== D3: Crisis Signal Admin View ====================

  // COMMUNITY_BACKLOG.md FOR-015: merges Forum and Circle crisis-flagged
  // content into the one admin queue (AdminCrisisAlertsTab.tsx) rather than
  // building a second review screen for Circles. Volume here is expected to
  // stay low (this is a rare-event safety queue, not a high-traffic list),
  // so both sources are fetched in full and merged/paginated in memory
  // instead of fighting cross-table SQL pagination.
  async getCrisisSignalPosts(page = 1, limit = 20) {
    const [forumPosts, circlePosts] = await Promise.all([
      this.prisma.forumPost.findMany({
        where: { hasCrisisSignal: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          thread: { select: { id: true, title: true, categoryId: true } },
        },
      }),
      (this.prisma as any).circleFeedPost.findMany({
        where: { hasCrisisSignal: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          circle: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    const combined = [
      ...forumPosts.map((p: any) => ({ ...p, source: 'forum' as const })),
      ...circlePosts.map((p: any) => ({ ...p, source: 'circle' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = combined.length;
    const skip = (page - 1) * limit;
    const pagePosts = combined.slice(skip, skip + limit);

    // Z1-803: who (if anyone) is already following each one up.
    const followUps = await this.prisma.crisisFollowUp.findMany({
      where: { OR: pagePosts.map((p) => ({ source: p.source, postId: p.id })) },
      include: { claimedBy: { select: { id: true, name: true } } },
    });
    const posts = pagePosts.map((p) => ({
      ...p,
      followUp: followUps.find((f) => f.source === p.source && f.postId === p.id) ?? null,
    }));

    return { posts, total, page, limit };
  }

  // ==================== Z1-803: Crisis follow-up ====================
  // A flag used to only notify admins: nobody could say "I'm on this", so two
  // admins could both reach out (or neither), and "Mark as Reviewed" recorded
  // nothing about what was done.

  private async findFlaggedPost(postId: string, source: 'forum' | 'circle') {
    const post =
      source === 'circle'
        ? await (this.prisma as any).circleFeedPost.findUnique({
            where: { id: postId },
            select: { id: true, authorId: true, hasCrisisSignal: true },
          })
        : await this.prisma.forumPost.findUnique({
            where: { id: postId },
            select: { id: true, authorId: true, hasCrisisSignal: true },
          });
    if (!post) throw new NotFoundException('Post not found');
    return post as { id: string; authorId: string; hasCrisisSignal: boolean };
  }

  async claimCrisisSignal(
    postId: string,
    source: 'forum' | 'circle',
    currentUser: CurrentUserPayload
  ) {
    const post = await this.findFlaggedPost(postId, source);
    const existing = await this.prisma.crisisFollowUp.findUnique({
      where: { source_postId: { source, postId } },
      include: { claimedBy: { select: { name: true } } },
    });
    if (existing?.status === 'RESOLVED' || !post.hasCrisisSignal) {
      throw new BadRequestException('This flag has already been resolved');
    }
    if (existing) {
      if (existing.claimedById === currentUser.id) return existing;
      throw new ConflictException(
        `${existing.claimedBy?.name ?? 'Another admin'} is already following this up`
      );
    }
    try {
      return await this.prisma.crisisFollowUp.create({
        data: {
          source,
          postId,
          authorId: post.authorId,
          claimedById: currentUser.id,
          claimedAt: new Date(),
        },
      });
    } catch (err) {
      // Two admins claiming at the same moment: the (source, postId) unique
      // index lets one through; the other gets the same answer as above.
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException('Another admin is already following this up');
      }
      throw err;
    }
  }

  async resolveCrisisSignal(
    postId: string,
    source: 'forum' | 'circle',
    dto: ResolveCrisisSignalDto,
    currentUser: CurrentUserPayload
  ) {
    const post = await this.findFlaggedPost(postId, source);
    const existing = await this.prisma.crisisFollowUp.findUnique({
      where: { source_postId: { source, postId } },
    });
    if (existing?.status === 'RESOLVED' || !post.hasCrisisSignal) {
      throw new BadRequestException('This flag has already been resolved');
    }
    const resolution = {
      status: 'RESOLVED',
      outcome: dto.outcome,
      note: dto.note?.trim() || null,
      resolvedById: currentUser.id,
      resolvedAt: new Date(),
    };
    const followUp = existing
      ? await this.prisma.crisisFollowUp.update({ where: { id: existing.id }, data: resolution })
      : await this.prisma.crisisFollowUp.create({
          data: { source, postId, authorId: post.authorId, ...resolution },
        });
    await this.clearCrisisSignal(postId, source, currentUser);
    return followUp;
  }

  async getCrisisFollowUpHistory(page = 1, limit = 20) {
    const where = { status: 'RESOLVED' };
    const [items, total] = await Promise.all([
      this.prisma.crisisFollowUp.findMany({
        where,
        orderBy: { resolvedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, name: true } },
          claimedBy: { select: { id: true, name: true } },
          resolvedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.crisisFollowUp.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async clearCrisisSignal(
    postId: string,
    source: 'forum' | 'circle' = 'forum',
    currentUser?: CurrentUserPayload
  ) {
    if (source === 'circle') {
      return (this.prisma as any).circleFeedPost.update({
        where: { id: postId },
        data: { hasCrisisSignal: false },
      });
    }
    // FOR-002: clearing the signal also lifts the heldForReview restriction
    // this fix added -- reviewed content becomes publicly visible again.
    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        hasCrisisSignal: false,
        heldForReview: false,
        reviewedBy: currentUser?.id,
        reviewedAt: new Date(),
      },
    });
  }
}
