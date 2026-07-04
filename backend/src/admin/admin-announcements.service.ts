import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateAnnouncementDto, AnnouncementTarget } from './dto/create-announcement.dto';

const TARGET_FOR_ROLE: Record<string, AnnouncementTarget> = {
  CLIENT: AnnouncementTarget.CLIENT,
  BABALAWO: AnnouncementTarget.BABALAWO,
  VENDOR: AnnouncementTarget.VENDOR,
};

export interface AnnouncementView {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  isActive: boolean;
  scheduledAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class AdminAnnouncementsService {
  constructor(private prisma: PrismaService) {}

  private toView(row: {
    id: string;
    title: string;
    content: string;
    type: string;
    target: string;
    status: string;
    scheduledAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }): AnnouncementView {
    const now = new Date();
    const isLive = row.status === 'ACTIVE' || (row.status === 'SCHEDULED' && (!row.scheduledAt || row.scheduledAt <= now));
    const isExpired = !!row.expiresAt && row.expiresAt <= now;
    return {
      id: row.id,
      title: row.title,
      message: row.content,
      type: row.type,
      target: row.target,
      isActive: row.status !== 'EXPIRED' && isLive && !isExpired,
      scheduledAt: row.scheduledAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async create(dto: CreateAnnouncementDto, currentUser: CurrentUserPayload): Promise<AnnouncementView> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can publish announcements');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const status = scheduledAt && scheduledAt > new Date() ? 'SCHEDULED' : 'ACTIVE';

    const row = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.message,
        type: dto.type,
        target: dto.target ?? AnnouncementTarget.ALL,
        targetIds: dto.targetIds ?? [],
        status,
        scheduledAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: currentUser.id,
      },
    });

    return this.toView(row);
  }

  async findAllForAdmin(currentUser: CurrentUserPayload): Promise<AnnouncementView[]> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view all announcements');
    }

    const rows = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toView(row));
  }

  async findActiveForUser(currentUser: CurrentUserPayload): Promise<AnnouncementView[]> {
    const now = new Date();
    const roleTarget = TARGET_FOR_ROLE[currentUser.role];

    const candidates = await this.prisma.announcement.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        target: {
          in: [
            AnnouncementTarget.ALL,
            ...(roleTarget ? [roleTarget] : []),
            AnnouncementTarget.DEVOTED,
            AnnouncementTarget.SPECIFIC,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const needsDevotedCheck = candidates.some((row) => row.target === AnnouncementTarget.DEVOTED);
    let isDevoted = false;
    if (needsDevotedCheck) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { subscriptionStatus: true },
      });
      isDevoted = user?.subscriptionStatus === 'DEVOTED';
    }

    const visible = candidates.filter((row) => {
      if (row.target === AnnouncementTarget.SPECIFIC) return row.targetIds.includes(currentUser.id);
      if (row.target === AnnouncementTarget.DEVOTED) return isDevoted;
      return true;
    });

    return visible.map((row) => this.toView(row));
  }

  async deactivate(id: string, currentUser: CurrentUserPayload): Promise<AnnouncementView> {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can deactivate announcements');
    }

    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    const row = await this.prisma.announcement.update({
      where: { id },
      data: { status: 'EXPIRED', expiresAt: new Date() },
    });

    return this.toView(row);
  }
}
