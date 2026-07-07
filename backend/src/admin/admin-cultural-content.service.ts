import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateDailyWordDto, UpdateDailyWordDto } from './dto/daily-word.dto';
import { CreateOralHistoryDto, UpdateOralHistoryDto } from './dto/oral-history.dto';
import { CreateSacredEventDto, UpdateSacredEventDto } from './dto/sacred-event.dto';

@Injectable()
export class AdminCulturalContentService {
  constructor(private prisma: PrismaService) {}

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
          example: dto.example || '',  // Provide default for required field
          culturalContext: dto.culturalContext || '',  // Provide default for required field
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

  async deleteDailyWord(id: string) {
    const existing = await this.prisma.dailyYorubaWord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily word not found');
    return this.prisma.dailyYorubaWord.delete({ where: { id } });
  }

  // ===== Oral History =====

  async getOralHistories() {
    return this.prisma.oralHistoryEntry.findMany({
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
      createdBy: admin.id,
    };
    if (dto.recordingDate) data.recordingDate = new Date(dto.recordingDate);
    if (dto.publish) data.publishedAt = new Date();

    return this.prisma.oralHistoryEntry.create({ data });
  }

  async updateOralHistory(id: string, dto: UpdateOralHistoryDto) {
    const existing = await this.prisma.oralHistoryEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Oral history entry not found');

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.babalawoName !== undefined) data.babalawoName = dto.babalawoName;
    if (dto.recordingDate !== undefined) data.recordingDate = new Date(dto.recordingDate);
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.sourceUrl !== undefined) data.sourceUrl = dto.sourceUrl;

    // Handle publish toggle
    if (dto.publish === true) data.publishedAt = new Date();
    else if (dto.publish === false) data.publishedAt = null;

    return this.prisma.oralHistoryEntry.update({ where: { id }, data });
  }

  async deleteOralHistory(id: string) {
    const existing = await this.prisma.oralHistoryEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Oral history entry not found');
    return this.prisma.oralHistoryEntry.delete({ where: { id } });
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
    return this.prisma.sacredCalendarEvent.create({
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

  async deleteSacredEvent(id: string) {
    const existing = await this.prisma.sacredCalendarEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sacred event not found');
    return this.prisma.sacredCalendarEvent.delete({ where: { id } });
  }
}