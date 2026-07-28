import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AdminContentService {
  private readonly logger = new Logger(AdminContentService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async getQuizQuestions() {
    return this.prisma.culturalQuizQuestion.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createQuizQuestion(data: Record<string, any>) {
    const count = await this.prisma.culturalQuizQuestion.count();
    return this.prisma.culturalQuizQuestion.create({
      data: {
        questionText: data.questionText,
        options: data.options,
        correctIndex: data.correctIndex,
        sortOrder: data.sortOrder ?? count,
      },
    });
  }

  async updateQuizQuestion(id: string, data: Record<string, any>) {
    return this.prisma.culturalQuizQuestion.update({ where: { id }, data });
  }

  async deleteQuizQuestion(id: string, currentUser: CurrentUserPayload) {
    const question = await this.prisma.culturalQuizQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException('Quiz question not found');
    }
    await this.prisma.culturalQuizQuestion.delete({ where: { id } });

    // P0-03: real queryable audit trail for hard deletes, not just a log line.
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'DELETE',
      entityType: 'CulturalQuizQuestion',
      entityId: id,
      payload: { snapshot: question },
    });

    return { success: true };
  }

  async getQuizStats() {
    const [passed, failed, failCounts] = await Promise.all([
      this.prisma.user.count({ where: { passedCulturalOrientation: true } }),
      this.prisma.user.count({
        where: { passedCulturalOrientation: false, culturalQuizFailCount: { gt: 0 } },
      }),
      this.prisma.user.aggregate({
        _avg: { culturalQuizFailCount: true },
        _max: { culturalQuizFailCount: true },
      }),
    ]);
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
    return {
      totalAttempted: passed + failed,
      passed,
      failed,
      passRate: passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0,
      avgFailsBeforePass: failCounts._avg.culturalQuizFailCount ?? 0,
      maxFails: failCounts._max.culturalQuizFailCount ?? 0,
      currentThreshold: settings?.quizPassThreshold ?? 2,
    };
  }

  async updateQuizThreshold(threshold: number) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      update: { quizPassThreshold: threshold },
      create: { id: 'singleton', quizPassThreshold: threshold },
    });
  }

  async resetUserQuizStatus(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passedCulturalOrientation: false, culturalQuizFailCount: 0 },
    });
    return { success: true, message: 'Cultural orientation status reset' };
  }
}
