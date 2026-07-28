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
import { RequestCheckInDto } from './dto/wellbeing.dto';

// COMMUNITY_BACKLOG.md FOR-017: consent-based, user-initiated wellbeing
// check-ins. Deliberately no automated distress detection -- a member asks,
// a human-designated carer responds. That's the whole loop.
@Injectable()
export class WellbeingService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async requestCheckIn(requesterId: string, dto: RequestCheckInDto) {
    const checkIn = await this.prisma.wellbeingCheckIn.create({
      data: { requesterId, message: dto.message },
    });

    const carers = await this.prisma.user.findMany({
      where: { OR: [{ isCommunityCarer: true }, { role: 'ADMIN' }] },
      select: { id: true },
      take: 10,
    });
    carers.forEach(({ id }) => {
      this.notificationService
        .createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.INFO,
          title: 'A community member requested a wellbeing check-in',
          message:
            'Someone in the community has asked for a check-in. Open Wellbeing Care to respond.',
          data: { checkInId: checkIn.id },
        })
        .catch(() => undefined);
    });

    return checkIn;
  }

  async getMyCheckIns(requesterId: string) {
    return this.prisma.wellbeingCheckIn.findMany({
      where: { requesterId },
      orderBy: { createdAt: 'desc' },
      include: { claimedBy: { select: { id: true, name: true } } },
    });
  }

  private async assertCarer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isCommunityCarer: true, role: true },
    });
    if (!user || (!user.isCommunityCarer && user.role !== 'ADMIN')) {
      throw new ForbiddenException(
        'Only designated community carers or admins can view this queue'
      );
    }
  }

  async getQueue(carerId: string) {
    await this.assertCarer(carerId);
    return this.prisma.wellbeingCheckIn.findMany({
      where: { status: { in: ['OPEN', 'CLAIMED'] } },
      orderBy: { createdAt: 'asc' },
      include: {
        requester: { select: { id: true, name: true, yorubaName: true, email: true } },
        claimedBy: { select: { id: true, name: true } },
      },
    });
  }

  async claim(checkInId: string, carerId: string) {
    await this.assertCarer(carerId);
    const checkIn = await this.prisma.wellbeingCheckIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) throw new NotFoundException('Check-in request not found');
    if (checkIn.status !== 'OPEN') {
      throw new BadRequestException('This check-in has already been claimed or resolved');
    }
    return this.prisma.wellbeingCheckIn.update({
      where: { id: checkInId },
      data: { status: 'CLAIMED', claimedById: carerId, claimedAt: new Date() },
    });
  }

  async resolve(checkInId: string, carerId: string) {
    await this.assertCarer(carerId);
    const checkIn = await this.prisma.wellbeingCheckIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) throw new NotFoundException('Check-in request not found');
    if (checkIn.status === 'RESOLVED') {
      throw new BadRequestException('This check-in is already resolved');
    }
    return this.prisma.wellbeingCheckIn.update({
      where: { id: checkInId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }
}
