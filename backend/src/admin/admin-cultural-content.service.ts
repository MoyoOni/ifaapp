import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateDailyWordDto, UpdateDailyWordDto } from './dto/daily-word.dto';
import {
  CreateOralHistoryDto,
  UpdateOralHistoryDto,
  SubmitOralHistoryDto,
} from './dto/oral-history.dto';
import { CreateSacredEventDto, UpdateSacredEventDto } from './dto/sacred-event.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

@Injectable()
export class AdminCulturalContentService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  // ===== Daily Words =====

  async getDailyWords() {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    return this.prisma.dailyYorubaWord.findMany({
      where: {
        date: {
          gte: today,
          lte: thirtyDaysLater,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createDailyWord(dto: CreateDailyWordDto, admin: CurrentUserPayload) {
    try {
      return await this.prisma.dailyYorubaWord.create({
        data: {
          word: dto.word,
          pronunciation: dto.pronunciation,
          definition: dto.definition,
          example: dto.example || '', // Provide default for required field
          culturalContext: dto.culturalContext || '', // Provide default for required field
          category: dto.category || 'General',
          date: new Date(dto.date),
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A word is already scheduled for this date');
      }
      throw error;
    }
  }

  async updateDailyWord(id: string, dto: UpdateDailyWordDto) {
    const existing = await this.prisma.dailyYorubaWord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily word not found');

    const data: any = {};
    if (dto.word !== undefined) data.word = dto.word;
    if (dto.pronunciation !== undefined) data.pronunciation = dto.pronunciation;
    if (dto.definition !== undefined) data.definition = dto.definition;
    if (dto.example !== undefined) data.example = dto.example;
    if (dto.culturalContext !== undefined) data.culturalContext = dto.culturalContext;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.date !== undefined) data.date = new Date(dto.date);

    return this.prisma.dailyYorubaWord.update({ where: { id }, data });
  }

  /**
   * ProBacklog-v1.md structural fix: UserWordHistory.word is
   * onDelete:Cascade, and getUserWordHistory() (yoruba-word.service.ts)
   * is a real user-facing "words you've seen" list -- deleting a word a
   * user had already viewed silently dropped it from their history with
   * no explanation. No isActive-style field exists on this model to
   * deactivate instead (unlike deleteProduct/deletePromo/deleteSacredEvent),
   * so this just blocks the delete outright once it has view history --
   * content admins rarely need to force-delete an already-shown word.
   */
  async deleteDailyWord(id: string) {
    const existing = await this.prisma.dailyYorubaWord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily word not found');

    const viewHistoryCount = await this.prisma.userWordHistory.count({ where: { wordId: id } });
    if (viewHistoryCount > 0) {
      throw new BadRequestException(
        'This word has already been shown to users and cannot be deleted, to preserve their word-history list.'
      );
    }

    return this.prisma.dailyYorubaWord.delete({ where: { id } });
  }

  // ===== Oral History =====

  async getOralHistories() {
    return this.prisma.oralHistoryEntry.findMany({
      where: { deletedAt: null },
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOralHistory(dto: CreateOralHistoryDto, admin: CurrentUserPayload) {
    const data: any = {
      title: dto.title,
      category: dto.category,
      babalawoName: dto.babalawoName,
      content: dto.content,
      sourceUrl: dto.sourceUrl,
      tags: dto.tags || [],
      relatedProductIds: dto.relatedProductIds || [],
      createdBy: admin.id,
    };
    if (dto.recordingDate) data.recordingDate = new Date(dto.recordingDate);
    if (dto.publish) data.publishedAt = new Date();

    return this.prisma.oralHistoryEntry.create({ data });
  }

  // COMMUNITY_BACKLOG.md FOR-024/FOR-026: same table, same admin review
  // queue (getOralHistories/updateOralHistory's publish toggle) as
  // createOralHistory above -- the only difference is publishedAt is never
  // set here, so a submission never goes live until an admin/elder does it.
  async submitCommunityOralHistory(dto: SubmitOralHistoryDto, userId: string) {
    const data: any = {
      title: dto.title,
      category: dto.category,
      babalawoName: dto.babalawoName,
      content: dto.content,
      sourceUrl: dto.sourceUrl,
      tags: dto.tags || [],
      relatedProductIds: dto.relatedProductIds || [],
      createdBy: userId,
    };
    if (dto.recordingDate) data.recordingDate = new Date(dto.recordingDate);

    return this.prisma.oralHistoryEntry.create({ data });
  }

  async updateOralHistory(id: string, dto: UpdateOralHistoryDto) {
    const existing = await this.prisma.oralHistoryEntry.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Oral history entry not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.babalawoName !== undefined) data.babalawoName = dto.babalawoName;
    if (dto.recordingDate !== undefined) data.recordingDate = new Date(dto.recordingDate);
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.sourceUrl !== undefined) data.sourceUrl = dto.sourceUrl;
    if (dto.relatedProductIds !== undefined) data.relatedProductIds = dto.relatedProductIds;

    // Handle publish toggle
    if (dto.publish === true) data.publishedAt = new Date();
    else if (dto.publish === false) data.publishedAt = null;

    return this.prisma.oralHistoryEntry.update({ where: { id }, data });
  }

  // ProBacklog-v1.md item #12 (soft-delete audit): community members submit
  // these via submitCommunityOralHistory above -- a real story someone spent
  // effort recording and getting elder-approved, not admin scratch content.
  // Soft-deleted like DreamEntry/etc; every read above filters deletedAt.
  async deleteOralHistory(id: string) {
    const existing = await this.prisma.oralHistoryEntry.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Oral history entry not found');
    return this.prisma.oralHistoryEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // SHOP_BACKLOG.md MSP-020: public "browse by story" view, distinct from
  // getOralHistories() above (admin-only, returns drafts too). Published-only,
  // same elder-review gate FOR-024/FOR-026 already established -- a story only
  // appears here once an admin/elder has set publishedAt via updateOralHistory.
  async getPublishedOralHistories(filters: {
    category?: string;
    productId?: string;
    tag?: string;
  }) {
    // SHOP_BACKLOG.md MSP-022: tag filter doubles as "community-curated
    // collections" (e.g. "Osun Grove items through the years") -- an
    // admin/elder already tags entries via the existing authoring form
    // (admin-cultural-content-tab.tsx), this just makes tags browsable.
    const entries = await this.prisma.oralHistoryEntry.findMany({
      where: {
        publishedAt: { not: null },
        deletedAt: null,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.productId ? { relatedProductIds: { has: filters.productId } } : {}),
        ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      },
      select: {
        id: true,
        title: true,
        category: true,
        babalawoName: true,
        content: true,
        sourceUrl: true,
        tags: true,
        relatedProductIds: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return this.resolveRelatedProducts(entries);
  }

  // relatedProductIds is a plain ID array (see the OralHistoryEntry model
  // comment), not a Prisma relation, so product names for "View related
  // item" links always need this second, batched lookup.
  private async resolveRelatedProducts<T extends { relatedProductIds: string[] }>(entries: T[]) {
    const productIds = [...new Set(entries.flatMap((e) => e.relatedProductIds))];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const productsById = new Map(products.map((p) => [p.id, p]));

    return entries.map((e) => ({
      ...e,
      relatedProducts: e.relatedProductIds
        .map((id) => productsById.get(id))
        .filter((p): p is { id: string; name: string } => !!p),
    }));
  }

  // SHOP_BACKLOG.md MSP-007: "educational content recommendations based on
  // purchased items" -- published stories/teachings whose relatedProductIds
  // intersect with products the user has actually bought. Deliberately not a
  // category-based match: Product.category ("Sacred & Ritual Items") and
  // OralHistoryEntry.category ("History", "Elder Teaching", ...) don't share
  // a taxonomy, so a fuzzy match would misrepresent "why am I seeing this."
  // Matching on the literal items owned keeps the "why" honest and specific.
  async getStoriesForUserPurchases(userId: string) {
    const purchasedItems = await this.prisma.orderItem.findMany({
      where: { order: { customerId: userId, status: { not: 'CANCELLED' } } },
      select: { productId: true },
    });
    const productIds = [...new Set(purchasedItems.map((i) => i.productId))];
    if (productIds.length === 0) return [];

    const entries = await this.prisma.oralHistoryEntry.findMany({
      where: {
        publishedAt: { not: null },
        deletedAt: null,
        relatedProductIds: { hasSome: productIds },
      },
      select: {
        id: true,
        title: true,
        category: true,
        babalawoName: true,
        content: true,
        sourceUrl: true,
        relatedProductIds: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return this.resolveRelatedProducts(entries);
  }

  // ===== Sacred Calendar Events =====

  async getSacredEvents() {
    return this.prisma.sacredCalendarEvent.findMany({
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async createSacredEvent(dto: CreateSacredEventDto, admin: CurrentUserPayload) {
    const event = await this.prisma.sacredCalendarEvent.create({
      data: {
        title: dto.title,
        yorubaName: dto.yorubaName,
        description: dto.description,
        date: new Date(dto.date),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        type: dto.type || 'FESTIVAL',
        bannerColor: dto.bannerColor,
        isActive: dto.isActive ?? true,
        createdBy: admin.id,
      },
    });

    // SHOP_BACKLOG.md MSP-008: "Vendor notifications for upcoming seasons"
    // -- notified at creation time rather than on a countdown, since events
    // are typically created well ahead of the date anyway and there's no
    // event<->vendor-category relation precise enough to target a subset.
    if (event.isActive) {
      const approvedVendors = await this.prisma.vendor.findMany({
        where: { status: 'APPROVED' },
        select: { userId: true },
        take: 200,
      });
      approvedVendors.forEach(({ userId }) => {
        this.notificationService
          .createNotification({
            userId,
            type: NotificationType.SYSTEM,
            category: NotificationCategory.INFO,
            title: `Prepare for ${event.title}`,
            message: `A new sacred calendar event is coming up on ${event.date.toLocaleDateString()}. Request to feature your seasonal items from your vendor dashboard.`,
            data: { eventId: event.id },
          })
          .catch(() => undefined);
      });
    }

    return event;
  }

  async updateSacredEvent(id: string, dto: UpdateSacredEventDto) {
    const existing = await this.prisma.sacredCalendarEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sacred event not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.yorubaName !== undefined) data.yorubaName = dto.yorubaName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.bannerColor !== undefined) data.bannerColor = dto.bannerColor;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.sacredCalendarEvent.update({ where: { id }, data });
  }

  /**
   * ProBacklog-v1.md structural fix: both RitualParticipation.event and
   * EventProductFeature.event are onDelete:Cascade, so an unguarded delete
   * here would silently destroy every RSVP/intention and every vendor
   * feature-request tied to this event. Deactivate (isActive: false)
   * instead once either exists, same posture as deleteProduct()/deletePromo().
   */
  async deleteSacredEvent(id: string) {
    const existing = await this.prisma.sacredCalendarEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sacred event not found');

    const [participationCount, featureRequestCount] = await Promise.all([
      this.prisma.ritualParticipation.count({ where: { eventId: id } }),
      this.prisma.eventProductFeature.count({ where: { eventId: id } }),
    ]);
    if (participationCount > 0 || featureRequestCount > 0) {
      await this.prisma.sacredCalendarEvent.update({ where: { id }, data: { isActive: false } });
      return {
        message: 'This event has RSVPs or vendor feature requests, so it was deactivated instead of deleted, to preserve that history.',
        deactivated: true,
      };
    }

    await this.prisma.sacredCalendarEvent.delete({ where: { id } });
    return { message: 'Sacred event deleted', deactivated: false };
  }

  // ==================== COMMUNITY_BACKLOG.md FOR-013: Ritual Participation ====================

  async rsvpToEvent(eventId: string, userId: string, intention?: string, isPublic = false) {
    const event = await this.prisma.sacredCalendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Sacred event not found');

    return this.prisma.ritualParticipation.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, intention, isPublic },
      update: { intention, isPublic },
    });
  }

  async cancelRsvp(eventId: string, userId: string) {
    const existing = await this.prisma.ritualParticipation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!existing) throw new NotFoundException("You have not RSVP'd to this event");
    return this.prisma.ritualParticipation.delete({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  async getEventParticipation(eventId: string, viewerId?: string) {
    const [count, publicIntentions, mine] = await Promise.all([
      this.prisma.ritualParticipation.count({ where: { eventId } }),
      this.prisma.ritualParticipation.findMany({
        where: { eventId, isPublic: true, intention: { not: null } },
        select: {
          intention: true,
          createdAt: true,
          user: { select: { id: true, name: true, yorubaName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      viewerId
        ? this.prisma.ritualParticipation.findUnique({
            where: { eventId_userId: { eventId, userId: viewerId } },
          })
        : null,
    ]);
    return { count, publicIntentions, myParticipation: mine };
  }
}
