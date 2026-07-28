import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { FileComplaintDto } from './dto/file-complaint.dto';

// COMMUNITY_BACKLOG.md FOR-016: client-facing side of PractitionerComplaint.
// Found while implementing FOR-016 that admin-complaints.service.ts could
// view and resolve complaints but nothing anywhere ever created one --
// `grep -rn "practitionerComplaint.create" src` returned zero matches. This
// is the missing entry point, mirroring healing.service.ts's report() shape
// (client-initiated, notifies reviewers, never auto-resolved).
@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async file(dto: FileComplaintDto, clientId: string) {
    if (dto.practitionerId === clientId) {
      throw new BadRequestException('You cannot file a complaint against yourself');
    }

    const practitioner = await this.prisma.user.findUnique({
      where: { id: dto.practitionerId },
      select: { id: true, role: true },
    });
    if (!practitioner || practitioner.role !== 'BABALAWO') {
      throw new NotFoundException('Practitioner not found');
    }

    const matchedKeywords = await this.matchKeywordFlagRules(dto.description);

    const complaint = await this.prisma.practitionerComplaint.create({
      data: {
        clientId,
        practitionerId: dto.practitionerId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence ?? [],
        flaggedByKeywordRule: matchedKeywords.length > 0,
        matchedKeywords,
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
      take: 10,
    });
    // COMMUNITY_BACKLOG.md FOR-016: a keyword match doesn't auto-act on
    // anything -- elder/admin review is still required -- but it does raise
    // the urgency of the review-queue notification, same "human decides,
    // rule just surfaces it" pattern as ADM-018's ForumPost queue.
    admins.forEach(({ id }) => {
      this.notificationService
        .createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category:
            matchedKeywords.length > 0 ? NotificationCategory.URGENT : NotificationCategory.WARNING,
          title:
            matchedKeywords.length > 0
              ? 'A practitioner complaint was flagged for urgent review'
              : 'A practitioner complaint awaits review',
          message:
            matchedKeywords.length > 0
              ? `A community member's complaint matched flagged terms (${matchedKeywords.join(', ')}). Open the Complaints tab to review.`
              : 'A community member has filed a concern about a practitioner. Open the Complaints tab to review.',
          data: { complaintId: complaint.id },
        })
        .catch(() => undefined);
    });

    return complaint;
  }

  // COMMUNITY_BACKLOG.md FOR-016: "Keyword/pattern-based community flagging
  // (not ML)". ContentFlagRule already existed (ADM-018's admin-curated
  // list) but nothing ever evaluated it against anything -- this is that
  // missing evaluator, scoped to KEYWORD-type rules against complaint text.
  private async matchKeywordFlagRules(description: string): Promise<string[]> {
    const rules = await this.prisma.contentFlagRule.findMany({
      where: { type: 'KEYWORD', isActive: true },
      select: { value: true },
    });
    const lowerDescription = description.toLowerCase();
    return rules
      .map((r) => r.value)
      .filter((keyword) => lowerDescription.includes(keyword.toLowerCase()));
  }

  async findMine(clientId: string) {
    return this.prisma.practitionerComplaint.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        practitioner: { select: { id: true, name: true, yorubaName: true } },
      },
    });
  }
}
