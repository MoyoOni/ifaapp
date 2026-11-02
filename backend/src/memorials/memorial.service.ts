import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemorialDto } from './dto/memorial.dto';
import { CrisisDetectionService } from '../shared/services/crisis-detection.service';
import { NotificationService } from '../notifications/notification.service';
import { notifyForumAdmins } from '../forum/notify-forum-admins';

// COMMUNITY_BACKLOG.md FOR-015: Ancestral Remembrance Wall. No admin review
// queue by design -- grief content should post immediately, same as any
// Circle feed post; the existing report/flag tooling covers misuse after
// the fact rather than gating every entry behind approval first.
@Injectable()
export class MemorialService {
  private readonly logger = new Logger(MemorialService.name);

  constructor(
    private prisma: PrismaService,
    private readonly crisisDetection: CrisisDetectionService,
    private readonly notificationService: NotificationService
  ) {}

  async create(dto: CreateMemorialDto, authorId: string) {
    // Z1-803: still posts immediately (see above), but distress written here
    // reaches the admin crisis queue like a forum or circle post would.
    const crisisDetected = this.crisisDetection.detect(dto.message);
    const entry = await this.prisma.memorialEntry.create({
      data: {
        name: dto.name,
        relationship: dto.relationship,
        message: dto.message,
        isPublic: dto.isPublic ?? true,
        authorId,
        hasCrisisSignal: crisisDetected,
      },
      include: {
        author: { select: { id: true, name: true, yorubaName: true } },
      },
    });
    if (crisisDetected) {
      await notifyForumAdmins(
        this.prisma,
        this.notificationService,
        this.logger,
        'Remembrance wall entry flagged for welfare review',
        'A new remembrance wall entry may contain a distress signal.',
        { memorialId: entry.id }
      );
    }
    return entry;
  }

  async findPublic(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.memorialEntry.findMany({
        where: { isPublic: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, yorubaName: true } },
        },
      }),
      this.prisma.memorialEntry.count({ where: { isPublic: true, deletedAt: null } }),
    ]);
    return { entries, total, page, limit };
  }

  // ProBacklog-v1.md item #3: soft-deleted -- grief/remembrance content
  // someone wrote about a lost loved one shouldn't be permanently destroyed
  // with no recovery path on what could be a misclick.
  async delete(id: string, currentUserId: string, isAdmin: boolean) {
    const entry = await this.prisma.memorialEntry.findUnique({ where: { id, deletedAt: null } });
    if (!entry) throw new NotFoundException('Memorial entry not found');
    if (entry.authorId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('You can only remove your own memorial entries');
    }
    return this.prisma.memorialEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
