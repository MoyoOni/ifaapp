import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { SesEmailService } from '../shared/services/ses-email.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminCampaignsService {
  private readonly logger = new Logger(AdminCampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private sesEmailService: SesEmailService,
    private auditService: AuditService
  ) {}

  async getCampaigns(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.emailCampaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { id: true, name: true } } },
      }),
      this.prisma.emailCampaign.count(),
    ]);
    return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async createCampaign(
    dto: { subject: string; body: string; segment: string; scheduledAt?: string },
    admin: CurrentUserPayload
  ) {
    return this.prisma.emailCampaign.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        segment: dto.segment,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        createdBy: admin.id,
      },
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async deleteCampaign(id: string, currentUser: CurrentUserPayload) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Cannot delete a campaign that has already been sent');
    }
    await this.prisma.emailCampaign.delete({ where: { id } });

    // P0-03: real queryable audit trail for hard deletes, not just a log line.
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'DELETE',
      entityType: 'EmailCampaign',
      entityId: id,
      payload: { snapshot: campaign },
    });
  }

  async sendCampaign(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.status === 'SENT') {
      throw new BadRequestException('This campaign has already been sent');
    }

    const recipients = await this.resolveSegment(campaign.segment);

    let sent = 0;
    for (const recipient of recipients) {
      const personalizedBody = campaign.body
        .replace(/\{\{name\}\}/g, recipient.name)
        .replace(/\{\{yorubaName\}\}/g, recipient.yorubaName || recipient.name);
      try {
        await this.sesEmailService.sendEmail(recipient.email, campaign.subject, personalizedBody);
        sent++;
      } catch (err) {
        this.logger.error(`Failed to send campaign ${id} to ${recipient.email}`, err as Error);
      }
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipientCount: sent,
      },
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  /**
   * Resolves a campaign segment into the list of recipient users.
   * COUNTRY_NG/UK/US are a best-effort match against the free-text `location`
   * field -- User has no structured country column, so this is an
   * approximation, not a precise filter (flagged as a known limitation
   * rather than silently treated as exact).
   */
  private async resolveSegment(
    segment: string
  ): Promise<Array<{ email: string; name: string; yorubaName: string | null }>> {
    const select = { email: true, name: true, yorubaName: true };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let where: Prisma.UserWhereInput = {};
    switch (segment) {
      case 'CLIENTS':
        where = { role: 'CLIENT' };
        break;
      case 'BABALAWOS':
        where = { role: 'BABALAWO' };
        break;
      case 'DEVOTED':
        where = { subscriptionStatus: 'DEVOTED' };
        break;
      case 'FREE_TIER':
        where = { subscriptionStatus: 'FREE' };
        break;
      case 'NEW_30D':
        where = { createdAt: { gte: thirtyDaysAgo } };
        break;
      case 'INACTIVE_30D':
        where = {
          OR: [
            { userSessions: { none: {} } },
            { userSessions: { every: { lastSeenAt: { lt: thirtyDaysAgo } } } },
          ],
        };
        break;
      case 'COUNTRY_NG':
        where = { location: { contains: 'Nigeria', mode: 'insensitive' } };
        break;
      case 'COUNTRY_UK':
        where = {
          OR: [
            { location: { contains: 'United Kingdom', mode: 'insensitive' } },
            { location: { contains: 'UK', mode: 'insensitive' } },
          ],
        };
        break;
      case 'COUNTRY_US':
        where = {
          OR: [
            { location: { contains: 'United States', mode: 'insensitive' } },
            { location: { contains: 'USA', mode: 'insensitive' } },
          ],
        };
        break;
      case 'ALL':
      default:
        where = {};
        break;
    }

    return this.prisma.user.findMany({ where, select });
  }
}
