import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDreamDto, InterpretDreamDto } from './dto/dream.dto';

// COMMUNITY_BACKLOG.md FOR-021: private-by-default dream journal, with two
// independent opt-ins -- share publicly, and/or request a Babalawo's
// interpretation. Neither implies the other.
@Injectable()
export class DreamService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDreamDto, authorId: string) {
    return this.prisma.dreamEntry.create({
      data: {
        content: dto.content,
        isPublic: dto.isPublic ?? false,
        interpretationRequested: dto.interpretationRequested ?? false,
        authorId,
      },
    });
  }

  async findMine(authorId: string) {
    return this.prisma.dreamEntry.findMany({
      where: { authorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { interpretedBy: { select: { id: true, name: true, yorubaName: true } } },
    });
  }

  async findShared(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.prisma.dreamEntry.findMany({
        where: { isPublic: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, yorubaName: true } },
          interpretedBy: { select: { id: true, name: true, yorubaName: true } },
        },
      }),
      this.prisma.dreamEntry.count({ where: { isPublic: true, deletedAt: null } }),
    ]);
    return { entries, total, page, limit };
  }

  async findInterpretationRequests(requesterRole: string) {
    if (requesterRole !== 'BABALAWO' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Only Babalawos can view interpretation requests');
    }
    return this.prisma.dreamEntry.findMany({
      where: { interpretationRequested: true, interpretation: null, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, yorubaName: true } } },
    });
  }

  async interpret(
    dreamId: string,
    dto: InterpretDreamDto,
    babalawoId: string,
    babalawoRole: string
  ) {
    if (babalawoRole !== 'BABALAWO' && babalawoRole !== 'ADMIN') {
      throw new ForbiddenException('Only Babalawos can provide dream interpretations');
    }
    const dream = await this.prisma.dreamEntry.findUnique({ where: { id: dreamId, deletedAt: null } });
    if (!dream) throw new NotFoundException('Dream entry not found');
    if (!dream.interpretationRequested) {
      throw new ForbiddenException('This dream was not submitted for interpretation');
    }
    return this.prisma.dreamEntry.update({
      where: { id: dreamId },
      data: {
        interpretation: dto.interpretation,
        interpretedById: babalawoId,
        interpretedAt: new Date(),
      },
    });
  }

  // ProBacklog-v1.md item #12 (soft-delete audit): a misclick used to
  // permanently destroy a private dream journal entry with no recovery
  // path. Now marks deletedAt instead -- every read above already filters
  // it out, matching the MemorialEntry/Message/Document/GuidancePlanTemplate
  // convention elsewhere in this codebase.
  async delete(dreamId: string, currentUserId: string, isAdmin: boolean) {
    const dream = await this.prisma.dreamEntry.findUnique({ where: { id: dreamId, deletedAt: null } });
    if (!dream) throw new NotFoundException('Dream entry not found');
    if (dream.authorId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('You can only remove your own dream entries');
    }
    return this.prisma.dreamEntry.update({ where: { id: dreamId }, data: { deletedAt: new Date() } });
  }
}
