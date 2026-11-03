import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafeguardingAlertService } from './safeguarding-alert.service';

export type CaseSource = 'COMPLAINT' | 'USER_REPORT' | 'CRISIS' | 'EMAIL' | 'OTHER';
export type CaseEntryKind = 'NOTE' | 'CONTACT' | 'MEASURE' | 'DECISION' | 'SYSTEM';

/**
 * docs/safeguarding SAFE-02 (November 3, 2026): one register for every
 * safeguarding matter, whichever route it came by -- a concern about a
 * practitioner, a safeguarding report about anyone, or something that
 * arrived by email -- with a reference, priority (Part B §13), handler,
 * status and a running log of contacts, measures and decisions.
 */
@Injectable()
export class SafeguardingCasesService {
  private readonly logger = new Logger(SafeguardingCasesService.name);

  constructor(
    private prisma: PrismaService,
    private alerts: SafeguardingAlertService
  ) {}

  private async nextRef(): Promise<string> {
    const n = (await this.prisma.safeguardingCase.count()) + 1;
    return `SG-${String(n).padStart(4, '0')}`;
  }

  async open(data: {
    source: CaseSource;
    sourceId?: string;
    subjectId?: string;
    reporterId?: string;
    category: string;
    summary: string;
    priority: 1 | 2 | 3;
    authorId?: string;
  }) {
    if (data.sourceId) {
      const existing = await this.prisma.safeguardingCase.findUnique({
        where: { source_sourceId: { source: data.source, sourceId: data.sourceId } },
      });
      if (existing) return existing;
    }
    // Two reports at the same moment can draw the same number; retry.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await this.prisma.safeguardingCase.create({
          data: {
            ref: await this.nextRef(),
            source: data.source,
            sourceId: data.sourceId,
            subjectId: data.subjectId,
            reporterId: data.reporterId,
            category: data.category,
            summary: data.summary.slice(0, 500),
            priority: data.priority,
            entries: { create: { kind: 'SYSTEM', authorId: data.authorId, text: `Case opened from ${data.source.toLowerCase().replace('_', ' ')}.` } },
          },
        });
        if (created.priority === 1) await this.alerts.urgentCase(created.ref);
        return created;
      } catch (err) {
        if ((err as { code?: string }).code !== 'P2002') throw err;
      }
    }
    throw new Error('Could not allocate a safeguarding case reference');
  }

  /** Opening a case must never stop a member's report from being filed. */
  async openQuietly(data: Parameters<SafeguardingCasesService['open']>[0]) {
    try {
      return await this.open(data);
    } catch (err) {
      this.logger.error(`Could not open a safeguarding case for ${data.source} ${data.sourceId}: ${(err as Error).message}`);
      return null;
    }
  }

  /** When the complaint or report behind a case is resolved, record it there. */
  async recordSourceOutcome(source: CaseSource, sourceId: string, text: string, authorId: string, close: boolean) {
    const c = await this.prisma.safeguardingCase.findUnique({ where: { source_sourceId: { source, sourceId } } });
    if (!c) return;
    await this.prisma.safeguardingCase.update({
      where: { id: c.id },
      data: {
        entries: { create: { kind: 'DECISION', authorId, text } },
        ...(close && c.status !== 'CLOSED' ? { status: 'CLOSED', closedAt: new Date() } : {}),
      },
    });
  }

  async list(filters: { status?: string; priority?: number }) {
    const where: Prisma.SafeguardingCaseWhereInput = {
      ...(filters.status ? { status: filters.status } : { status: { not: 'CLOSED' } }),
      ...(filters.priority ? { priority: filters.priority } : {}),
    };
    const [cases, crisisOpen] = await Promise.all([
      this.prisma.safeguardingCase.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        take: 200,
        include: { _count: { select: { entries: true } } },
      }),
      this.openCrisisFlags(),
    ]);
    // Names for the people on each case, in one query.
    const ids = [...new Set(cases.flatMap((c) => [c.subjectId, c.reporterId, c.handlerId]).filter((x): x is string => !!x))];
    const people = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, role: true } });
    const byId = new Map(people.map((p) => [p.id, p]));
    return {
      cases: cases.map((c) => ({
        ...c,
        subject: c.subjectId ? byId.get(c.subjectId) ?? null : null,
        reporter: c.reporterId ? byId.get(c.reporterId) ?? null : null,
        handler: c.handlerId ? byId.get(c.handlerId) ?? null : null,
      })),
      // Crisis flags keep their own claim/resolve queue; the register shows
      // how many are waiting so nothing is missed.
      crisisOpen,
    };
  }

  private async openCrisisFlags(): Promise<number> {
    const [a, b, c, d] = await Promise.all([
      this.prisma.forumPost.count({ where: { hasCrisisSignal: true } }),
      this.prisma.circleFeedPost.count({ where: { hasCrisisSignal: true } }),
      this.prisma.circleFeedComment.count({ where: { hasCrisisSignal: true } }),
      this.prisma.memorialEntry.count({ where: { hasCrisisSignal: true, deletedAt: null } }),
    ]);
    return a + b + c + d;
  }

  async get(id: string) {
    const c = await this.prisma.safeguardingCase.findUnique({
      where: { id },
      include: { entries: { orderBy: { createdAt: 'asc' } } },
    });
    if (!c) throw new NotFoundException('Case not found');
    const ids = [c.subjectId, c.reporterId, c.handlerId, ...c.entries.map((e) => e.authorId)].filter((x): x is string => !!x);
    const people = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, role: true } });
    const byId = new Map(people.map((p) => [p.id, p]));
    const restrictions = c.subjectId
      ? await this.prisma.accountRestriction.findMany({ where: { userId: c.subjectId }, orderBy: { createdAt: 'desc' } })
      : [];
    return {
      ...c,
      subject: c.subjectId ? byId.get(c.subjectId) ?? null : null,
      reporter: c.reporterId ? byId.get(c.reporterId) ?? null : null,
      handler: c.handlerId ? byId.get(c.handlerId) ?? null : null,
      entries: c.entries.map((e) => ({ ...e, author: e.authorId ? byId.get(e.authorId)?.name ?? null : null })),
      restrictions,
    };
  }

  async update(id: string, data: { status?: string; priority?: number; handlerId?: string | null }, authorId: string) {
    const c = await this.prisma.safeguardingCase.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Case not found');
    const changes: string[] = [];
    if (data.status && data.status !== c.status) changes.push(`Status ${c.status} → ${data.status}`);
    if (data.priority && data.priority !== c.priority) changes.push(`Priority ${c.priority} → ${data.priority}`);
    if (data.handlerId !== undefined && data.handlerId !== c.handlerId) {
      if (data.handlerId) {
        const handler = await this.prisma.user.findUnique({ where: { id: data.handlerId }, select: { role: true, adminSubRole: true, name: true } });
        if (!handler || handler.role !== 'ADMIN' || !['SAFEGUARDING', 'SUPER'].includes(handler.adminSubRole ?? '')) {
          throw new BadRequestException('A case can only be handled by a Safeguarding or Super admin');
        }
        changes.push(`Handler: ${handler.name}`);
      } else {
        changes.push('Handler removed');
      }
    }
    if (changes.length === 0) return this.get(id);
    await this.prisma.safeguardingCase.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status, closedAt: data.status === 'CLOSED' ? new Date() : null } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.handlerId !== undefined ? { handlerId: data.handlerId } : {}),
        entries: { create: { kind: 'SYSTEM', authorId, text: changes.join('; ') } },
      },
    });
    if (data.priority === 1 && c.priority !== 1) await this.alerts.urgentCase(c.ref);
    return this.get(id);
  }

  async addEntry(id: string, kind: CaseEntryKind, text: string, authorId: string) {
    const c = await this.prisma.safeguardingCase.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Case not found');
    await this.prisma.safeguardingCaseEntry.create({ data: { caseId: id, kind, text, authorId } });
    return this.get(id);
  }
}
