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
import { RequestMentorshipDto, RequestSpiritualLeaveDto } from './dto/vendor-community.dto';

const MENTORSHIP_PERIOD_DAYS = 30;
const MAX_ACTIVE_MENTEES_PER_MENTOR = 3;
const MENTOR_MIN_TENURE_DAYS = 60;
const CULTURAL_TRAINING_COURSE_SLUG = 'ori-the-metaphysics-of-consciousness';

// VENDOR_BACKLOG.md VND-019 (mentorship) + SHOP_BACKLOG.md MSP-016 (apprenticeship
// progress) + MSP-018 (spiritual leave). Wellness check-ins deliberately reuse
// COMMUNITY_BACKLOG.md's FOR-017 (/wellbeing/check-in) rather than a parallel
// vendor-only system -- any authenticated user, vendors included, can already
// request one there.
@Injectable()
export class VendorCommunityService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  private async getOwnVendor(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('You must be a vendor to use this feature');
    return vendor;
  }

  async getAvailableMentors(userId: string) {
    const vendor = await this.getOwnVendor(userId);
    const eligibleSince = new Date(Date.now() - MENTOR_MIN_TENURE_DAYS * 24 * 60 * 60 * 1000);

    const candidates = await this.prisma.vendor.findMany({
      where: {
        id: { not: vendor.id },
        status: 'APPROVED',
        OR: [
          { verifiedAt: { lte: eligibleSince } },
          { verifiedAt: null, createdAt: { lte: eligibleSince } },
        ],
      },
      select: {
        id: true,
        businessName: true,
        apprenticeshipTier: true,
        description: true,
        _count: { select: { mentorshipsAsMentor: true } },
      },
    });

    const activeCounts = await this.prisma.vendorMentorship.groupBy({
      by: ['mentorId'],
      where: { mentorId: { in: candidates.map((c) => c.id) }, status: 'ACTIVE' },
      _count: { id: true },
    });
    const activeCountByMentor = new Map(activeCounts.map((c) => [c.mentorId, c._count.id]));

    return candidates
      .map((c) => ({
        id: c.id,
        businessName: c.businessName,
        apprenticeshipTier: c.apprenticeshipTier,
        description: c.description,
        activeMenteeCount: activeCountByMentor.get(c.id) ?? 0,
      }))
      .filter((c) => c.activeMenteeCount < MAX_ACTIVE_MENTEES_PER_MENTOR);
  }

  async requestMentorship(userId: string, dto: RequestMentorshipDto) {
    const vendor = await this.getOwnVendor(userId);

    const existingActive = await this.prisma.vendorMentorship.findFirst({
      where: { menteeId: vendor.id, status: 'ACTIVE' },
    });
    if (existingActive) {
      throw new BadRequestException('You already have an active mentor');
    }

    if (dto.mentorVendorId === vendor.id) {
      throw new BadRequestException('You cannot mentor yourself');
    }

    const mentor = await this.prisma.vendor.findUnique({ where: { id: dto.mentorVendorId } });
    if (!mentor) throw new NotFoundException('Mentor not found');
    if (mentor.status !== 'APPROVED') {
      throw new BadRequestException('This vendor is not eligible to mentor right now');
    }

    const activeMenteeCount = await this.prisma.vendorMentorship.count({
      where: { mentorId: mentor.id, status: 'ACTIVE' },
    });
    if (activeMenteeCount >= MAX_ACTIVE_MENTEES_PER_MENTOR) {
      throw new BadRequestException(
        'This mentor already has a full mentee list — try another mentor'
      );
    }

    const endsAt = new Date(Date.now() + MENTORSHIP_PERIOD_DAYS * 24 * 60 * 60 * 1000);
    const mentorship = await this.prisma.vendorMentorship.create({
      data: { mentorId: mentor.id, menteeId: vendor.id, endsAt },
    });

    this.notificationService
      .createNotification({
        userId: mentor.userId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.INFO,
        title: 'A new vendor has requested your mentorship',
        message: `${vendor.businessName} has asked you to be their mentor for their first 30 days on Ìlú Àṣẹ. Open Vendor Circle to say hello.`,
        data: { mentorshipId: mentorship.id },
      })
      .catch(() => undefined);

    return mentorship;
  }

  async getMyMentorship(userId: string) {
    const vendor = await this.getOwnVendor(userId);

    const [asMentee, asMentor] = await Promise.all([
      this.prisma.vendorMentorship.findFirst({
        where: { menteeId: vendor.id, status: 'ACTIVE' },
        include: { mentor: { select: { id: true, businessName: true, apprenticeshipTier: true } } },
      }),
      this.prisma.vendorMentorship.findMany({
        where: { mentorId: vendor.id, status: 'ACTIVE' },
        include: { mentee: { select: { id: true, businessName: true } } },
      }),
    ]);

    return { asMentee, asMentor };
  }

  async completeMentorship(mentorshipId: string, userId: string) {
    const vendor = await this.getOwnVendor(userId);
    const mentorship = await this.prisma.vendorMentorship.findUnique({
      where: { id: mentorshipId },
    });
    if (!mentorship) throw new NotFoundException('Mentorship not found');
    if (mentorship.mentorId !== vendor.id) {
      throw new ForbiddenException('Only the mentor can mark this mentorship complete');
    }
    if (mentorship.status === 'COMPLETED') {
      throw new BadRequestException('This mentorship is already marked complete');
    }

    const updated = await this.prisma.vendorMentorship.update({
      where: { id: mentorshipId },
      data: { status: 'COMPLETED' },
    });

    const mentee = await this.prisma.vendor.findUnique({ where: { id: mentorship.menteeId } });
    if (mentee) {
      this.notificationService
        .createNotification({
          userId: mentee.userId,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: 'Your mentorship period is complete',
          message: `${vendor.businessName} has marked your mentorship period complete. Welcome to the Vendor Circle as a peer.`,
          data: { mentorshipId },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  async requestSpiritualLeave(userId: string, dto: RequestSpiritualLeaveDto) {
    const vendor = await this.getOwnVendor(userId);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('End date must be on or after the start date');
    }

    return this.prisma.vendorSpiritualLeave.create({
      data: { vendorId: vendor.id, reason: dto.reason, startDate, endDate },
    });
  }

  async getMySpiritualLeaves(userId: string) {
    const vendor = await this.getOwnVendor(userId);
    return this.prisma.vendorSpiritualLeave.findMany({
      where: { vendorId: vendor.id },
      orderBy: { startDate: 'desc' },
    });
  }

  async getApprenticeshipProgress(userId: string) {
    const vendor = await this.getOwnVendor(userId);

    const [
      completedTraining,
      mentorshipsAsMenteeCount,
      mentorshipsAsMentorCount,
      currentMentorship,
    ] = await Promise.all([
      this.prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          completedAt: { not: null },
          course: { slug: CULTURAL_TRAINING_COURSE_SLUG },
        },
      }),
      this.prisma.vendorMentorship.count({ where: { menteeId: vendor.id } }),
      this.prisma.vendorMentorship.count({ where: { mentorId: vendor.id, status: 'COMPLETED' } }),
      this.prisma.vendorMentorship.findFirst({
        where: { menteeId: vendor.id, status: 'ACTIVE' },
        include: { mentor: { select: { businessName: true } } },
      }),
    ]);

    return {
      apprenticeshipTier: vendor.apprenticeshipTier,
      tierUpdatedAt: vendor.tierUpdatedAt,
      culturalTrainingCompleted: !!completedTraining,
      hasBeenMentored: mentorshipsAsMenteeCount > 0,
      currentMentorBusinessName: currentMentorship?.mentor.businessName ?? null,
      menteesGraduated: mentorshipsAsMentorCount,
      verificationStatus: vendor.status,
    };
  }
}
