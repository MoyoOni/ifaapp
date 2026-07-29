import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { AskTechHelpDto, AnswerTechHelpDto } from './dto/tech-help.dto';

// COMMUNITY_BACKLOG.md FOR-009 (platform owner decision, July 29, 2026):
// low-friction tech-help board -- elders (BABALAWO) ask, any community
// member can answer. Distinct from "Ask an Elder" (spiritual Q&A elders
// answer) and community-mentorship (general newcomer mentorship).
@Injectable()
export class TechHelpService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async ask(dto: AskTechHelpDto, requesterId: string, role: string) {
    if (role !== 'BABALAWO') {
      throw new ForbiddenException('This tech-help board is for our elders (Babalawos)');
    }
    return this.prisma.techHelpRequest.create({
      data: { requesterId, question: dto.question },
    });
  }

  async findOpen() {
    return this.prisma.techHelpRequest.findMany({
      where: { status: 'OPEN' },
      include: {
        requester: { select: { id: true, name: true, yorubaName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMine(userId: string) {
    return this.prisma.techHelpRequest.findMany({
      where: { requesterId: userId },
      include: {
        answeredBy: { select: { id: true, name: true, yorubaName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answer(id: string, dto: AnswerTechHelpDto, answererId: string) {
    const request = await this.prisma.techHelpRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Tech-help request not found');
    if (request.status === 'ANSWERED') {
      throw new BadRequestException('This question has already been answered');
    }

    const updated = await this.prisma.techHelpRequest.update({
      where: { id },
      data: {
        status: 'ANSWERED',
        answer: dto.answer,
        answeredById: answererId,
        answeredAt: new Date(),
      },
    });

    this.notificationService
      .createNotification({
        userId: request.requesterId,
        type: NotificationType.SYSTEM,
        category: NotificationCategory.SUCCESS,
        title: 'Someone answered your tech-help question',
        message: dto.answer,
        data: { techHelpRequestId: id },
      })
      .catch(() => undefined);

    return updated;
  }
}
