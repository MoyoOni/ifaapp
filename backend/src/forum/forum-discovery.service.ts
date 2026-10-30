import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ThreadStatus, CourseStatus } from '@ile-ase/common';
import { EmailService } from '../notifications/email.service';
import { inSeasonEventWhere } from '../marketplace/seasonal-event-reminder.service';

// Split out of ForumService (October 30, 2026), methods moved verbatim.
// Discovery: share tracking, related products, seasonal highlights, thread series, the digest, and search.
@Injectable()
export class ForumDiscoveryService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

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

  // ==================== COMMUNITY_BACKLOG.md FOR-007: Seasonal Highlights ====================

  // Sacred-calendar events that are upcoming (within 3 days) or underway, each
  // with the gathering thread SeasonalEventReminderService created for it.
  // Events whose thread hasn't been created yet (or was deleted) are left
  // out rather than shown with nowhere to go.
  async getSeasonalHighlights() {
    const events = await this.prisma.sacredCalendarEvent.findMany({
      where: { ...inSeasonEventWhere(new Date()), gatheringThreadId: { not: null } },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        yorubaName: true,
        date: true,
        endDate: true,
        gatheringThreadId: true,
      },
    });
    if (events.length === 0) return [];

    const threads = await this.prisma.forumThread.findMany({
      where: {
        id: { in: events.map((e) => e.gatheringThreadId as string) },
        status: { not: 'DELETED' },
        isApproved: true,
      },
      select: { id: true, title: true, postCount: true },
    });
    const byId = new Map(threads.map((t) => [t.id, t]));

    return events
      .filter((e) => byId.has(e.gatheringThreadId as string))
      .map(({ gatheringThreadId, ...event }) => ({
        ...event,
        thread: byId.get(gatheringThreadId as string)!,
      }));
  }

  // ==================== COMMUNITY_BACKLOG.md FOR-004: Learning Pathways ====================

  // "Structured thread series for core concepts (curated, not auto-generated)".
  // Threads already carry isTeachingSeries/seriesName (set only by
  // Babalawo/Admin at creation, see createThread above) -- the only real gap
  // was a way to browse them grouped by series, which didn't exist yet.
  async getThreadSeries() {
    const threads = await this.prisma.forumThread.findMany({
      where: { isTeachingSeries: true, seriesName: { not: null }, status: ThreadStatus.ACTIVE },
      select: {
        seriesName: true,
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const bySeries = new Map<
      string,
      {
        seriesName: string;
        category: { id: string; name: string; slug: string };
        threadCount: number;
        startedAt: Date;
      }
    >();
    for (const t of threads) {
      const key = t.seriesName as string;
      const existing = bySeries.get(key);
      if (existing) {
        existing.threadCount += 1;
      } else {
        bySeries.set(key, {
          seriesName: key,
          category: t.category,
          threadCount: 1,
          startedAt: t.createdAt,
        });
      }
    }

    return [...bySeries.values()].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  async getThreadsInSeries(seriesName: string, currentUser?: CurrentUserPayload | null) {
    const threads = await this.prisma.forumThread.findMany({
      where: { isTeachingSeries: true, seriesName, status: ThreadStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
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
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    // "Progress tracking for community learning" -- how many of this
    // series's threads the current user has posted in, reusing ForumPost
    // rather than a new tracking model.
    let myProgress: { postedInThreads: number; totalThreads: number } | null = null;
    if (currentUser && threads.length > 0) {
      const postedThreadIds = await this.prisma.forumPost.findMany({
        where: { authorId: currentUser.id, threadId: { in: threads.map((t) => t.id) } },
        select: { threadId: true },
        distinct: ['threadId'],
      });
      myProgress = { postedInThreads: postedThreadIds.length, totalThreads: threads.length };
    }

    return {
      seriesName,
      threads,
      myProgress,
      recommendedCourses:
        threads.length > 0 ? await this.getRecommendedCoursesForSeries(seriesName, threads) : [],
    };
  }

  // "Integration with Academy course recommendations" -- rule-based, same
  // keyword-match approach as getRelatedProducts above, not ML/semantic.
  // Course has no shared taxonomy with ForumCategory/ForumThread, so this
  // matches on plain keyword overlap between the series' thread titles and
  // course title/description/category.
  private async getRecommendedCoursesForSeries(seriesName: string, threads: { title: string }[]) {
    const text = `${seriesName} ${threads.map((t) => t.title).join(' ')}`;
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const keywords = [...new Set(words)];
    if (keywords.length === 0) return [];

    const courses = await this.prisma.course.findMany({
      where: {
        status: CourseStatus.APPROVED,
        OR: keywords
          .slice(0, 10)
          .flatMap((kw) => [
            { title: { contains: kw, mode: 'insensitive' as const } },
            { category: { contains: kw, mode: 'insensitive' as const } },
          ]),
      },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        level: true,
        thumbnail: true,
        price: true,
        currency: true,
      },
    });

    return courses;
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
      const threadCards = threads
        .map(
          (t) => `
        <div style="border:1px solid #e2d9c8;border-radius:12px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8b7355;">${t.category}</p>
          <h3 style="margin:0 0 8px;font-size:16px;color:#2d1f0e;">${t.title}</h3>
          <p style="margin:0 0 12px;font-size:14px;color:#6b5a48;">${t.excerpt}…</p>
          <p style="margin:0 0 12px;font-size:12px;color:#a08060;">${t.postCount} replies · by ${t.authorName}</p>
          <a href="${t.threadUrl}" style="display:inline-block;padding:8px 20px;background:#c8973a;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:bold;">Join the dialogue →</a>
        </div>
      `
        )
        .join('');

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
          OR: [{ title: ilike }, { content: ilike }, { tags: { has: query } }],
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
}
