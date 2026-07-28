import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { RequestCommunityMentorshipDto } from './dto/community-mentorship.dto';

const MENTORSHIP_PERIOD_DAYS = 30;
const MAX_ACTIVE_MENTEES_PER_MENTOR = 3;

// COMMUNITY_BACKLOG.md FOR-004: "Mentorship matching for new members" for
// the Cultural Learning Pathways item. Deliberately the same shape as
// VendorCommunityService's mentorship methods (VENDOR_BACKLOG.md VND-019) --
// self-service request rather than auto-matched, one active mentorship at a
// time, capped mentee load per mentor. The mentor pool is any user who has
// opted in via answersElderQuestions (COMMUNITY_BACKLOG.md FOR-Q3's "Ask an
// Elder"), since that's already the platform's one self-selected pool of
// people willing to guide newer members -- no separate tenure gate needed,
// the opt-in itself is the eligibility signal.
@Injectable()
export class CommunityMentorshipService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async getAvailableMentors(userId: string) {
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        answersElderQuestions: true,
      },
      select: {
        id: true,
        name: true,
        yorubaName: true,
        avatar: true,
        specialization: true,
        availabilityNote: true,
        _count: { select: { communityMentorshipsAsMentor: true } },
      },
    });

    const activeCounts = await this.prisma.communityMentorship.groupBy({
      by: ['mentorId'],
      where: { mentorId: { in: candidates.map((c) => c.id) }, status: 'ACTIVE' },
      _count: { id: true },
    });
    const activeCountByMentor = new Map(activeCounts.map((c) => [c.mentorId, c._count.id]));

    return candidates
      .map((c) => ({
        id: c.id,
        name: c.name,
        yorubaName: c.yorubaName,
        avatar: c.avatar,
        specialization: c.specialization,
        availabilityNote: c.availabilityNote,
        activeMenteeCount: activeCountByMentor.get(c.id) ?? 0,
      }))
      .filter((c) => c.activeMenteeCount < MAX_ACTIVE_MENTEES_PER_MENTOR);
  }

  async requestMentorship(userId: string, dto: RequestCommunityMentorshipDto) {
    const existingActive = await this.prisma.communityMentorship.findFirst({
      where: { menteeId: userId, status: 'ACTIVE' },
    });
    if (existingActive) {
      throw new BadRequestException('You already have an active mentor');
    }

    if (dto.mentorUserId === userId) {
      throw new BadRequestException('You cannot mentor yourself');
    }

    const mentor = await this.prisma.user.findUnique({ where: { id: dto.mentorUserId } });
    if (!mentor) throw new NotFoundException('Mentor not found');
    if (!mentor.answersElderQuestions) {
      throw new BadRequestException('This member is not currently accepting mentees');
    }

    const activeMenteeCount = await this.prisma.communityMentorship.count({
      where: { mentorId: mentor.id, status: 'ACTIVE' },
    });
    if (activeMenteeCount >= MAX_ACTIVE_MENTEES_PER_MENTOR) {
      throw new BadRequestException(
        'This mentor already has a full mentee list — try another mentor'
      );
    }

    const endsAt = new Date(Date.now() + MENTORSHIP_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const mentorship = await this.prisma.communityMentorship.create({
      data: { mentorId: mentor.id, menteeId: userId, endsAt },
    });

    this.notificationService
      .createNotification({
        userId: mentor.id,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'A new member has requested your mentorship',
        message:
          'Someone new to the community has asked you to be their mentor for their first 30 days on Ìlú Àṣẹ.',
        data: { mentorshipId: mentorship.id },
      })
      .catch(() => undefined);

    return mentorship;
  }

  async getMyMentorship(userId: string) {
    const [asMentee, asMentor] = await Promise.all([
      this.prisma.communityMentorship.findFirst({
        where: { menteeId: userId, status: 'ACTIVE' },
        include: { mentor: { select: { id: true, name: true, yorubaName: true, avatar: true } } },
      }),
      this.prisma.communityMentorship.findMany({
        where: { mentorId: userId, status: 'ACTIVE' },
        include: { mentee: { select: { id: true, name: true, yorubaName: true, avatar: true } } },
      }),
    ]);

    return { asMentee, asMentor };
  }

  async completeMentorship(mentorshipId: string, userId: string) {
    const mentorship = await this.prisma.communityMentorship.findUnique({
      where: { id: mentorshipId },
    });
    if (!mentorship) throw new NotFoundException('Mentorship not found');
    if (mentorship.mentorId !== userId) {
      throw new ForbiddenException('Only the mentor can mark this mentorship complete');
    }
    if (mentorship.status === 'COMPLETED') {
      throw new BadRequestException('This mentorship is already marked complete');
    }

    const updated = await this.prisma.communityMentorship.update({
      where: { id: mentorshipId },
      data: { status: 'COMPLETED' },
    });

    this.notificationService
      .createNotification({
        userId: mentorship.menteeId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'Your mentorship period is complete',
        message:
          'Your mentor has marked your mentorship period complete. Welcome to the community as a peer.',
        data: { mentorshipId },
      })
      .catch(() => undefined);

    return updated;
  }
}
