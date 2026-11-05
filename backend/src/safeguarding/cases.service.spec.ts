import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SafeguardingCasesService } from './cases.service';

// docs/safeguarding SAFE-02
describe('SafeguardingCasesService', () => {
  const prisma = {
    safeguardingCase: { count: jest.fn().mockResolvedValue(6), findUnique: jest.fn(), create: jest.fn(), update: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([]) },
    safeguardingCaseEntry: { create: jest.fn().mockResolvedValue({}) },
    user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() },
    accountRestriction: { findMany: jest.fn().mockResolvedValue([]) },
    forumPost: { count: jest.fn().mockResolvedValue(1) },
    circleFeedPost: { count: jest.fn().mockResolvedValue(0) },
    circleFeedComment: { count: jest.fn().mockResolvedValue(2) },
    memorialEntry: { count: jest.fn().mockResolvedValue(0) },
  };
  const alerts = { urgentCase: jest.fn().mockResolvedValue(undefined) };
  const service = new SafeguardingCasesService(prisma as never, alerts as never);
  const base = { source: 'USER_REPORT' as const, sourceId: 'rep-1', category: 'HARASSMENT', summary: 'Repeated threats', priority: 2 as const };
  beforeEach(() => jest.clearAllMocks());

  it('numbers cases SG-0001 onwards and alerts the lead for Priority 1', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue(null);
    prisma.safeguardingCase.create.mockImplementation((a) => Promise.resolve({ id: 'c7', ...a.data }));
    const c = await service.open({ ...base, priority: 1 });
    expect(c.ref).toBe('SG-0007');
    expect(alerts.urgentCase).toHaveBeenCalledWith('SG-0007');
    await service.open(base);
    expect(alerts.urgentCase).toHaveBeenCalledTimes(1);
  });

  it('opens one case per report, however many times it is called', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.open(base)).resolves.toEqual({ id: 'existing' });
    expect(prisma.safeguardingCase.create).not.toHaveBeenCalled();
  });

  it('retries the reference when two cases open at once', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue(null);
    prisma.safeguardingCase.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'P2002' })).mockResolvedValueOnce({ id: 'c8', ref: 'SG-0007', priority: 2 });
    await expect(service.open(base)).resolves.toMatchObject({ id: 'c8' });
  });

  it('never lets a case failure stop a report being filed', async () => {
    prisma.safeguardingCase.findUnique.mockRejectedValue(new Error('db down'));
    await expect(service.openQuietly(base)).resolves.toBeNull();
    prisma.safeguardingCase.findUnique.mockReset();
  });

  it('records the outcome of the report on its case and closes it', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue({ id: 'c1', status: 'OPEN' });
    await service.recordSourceOutcome('COMPLAINT', 'cmp-1', 'RESOLVE: upheld', 'lead', true);
    expect(prisma.safeguardingCase.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { entries: { create: { kind: 'DECISION', authorId: 'lead', text: 'RESOLVE: upheld' } }, status: 'CLOSED', closedAt: expect.any(Date) },
    });
    prisma.safeguardingCase.findUnique.mockResolvedValue(null);
    await service.recordSourceOutcome('COMPLAINT', 'no-case', 'x', 'lead', true);
    expect(prisma.safeguardingCase.update).toHaveBeenCalledTimes(1);
  });

  it('lists open cases priority-first with the crisis flags still waiting', async () => {
    const res = await service.list({});
    expect(prisma.safeguardingCase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { not: 'CLOSED' } }, orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }] }));
    expect(res.crisisOpen).toBe(3);
  });

  it('lets only a Safeguarding or Super admin handle a case, and logs every change', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue({ id: 'c1', ref: 'SG-0001', status: 'OPEN', priority: 2, handlerId: null, entries: [], subjectId: null, reporterId: null });
    prisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN', adminSubRole: 'MODERATOR', name: 'Mod' });
    await expect(service.update('c1', { handlerId: 'mod' }, 'lead')).rejects.toBeInstanceOf(BadRequestException);
    prisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN', adminSubRole: 'SAFEGUARDING', name: 'Lead' });
    await service.update('c1', { handlerId: 'lead', priority: 1, status: 'INVESTIGATING' }, 'lead');
    const data = prisma.safeguardingCase.update.mock.calls.at(-1)[0].data;
    expect(data.entries.create.text).toBe('Status OPEN → INVESTIGATING; Priority 2 → 1; Handler: Lead');
    expect(alerts.urgentCase).toHaveBeenCalledWith('SG-0001');
  });

  it('404s on a case that does not exist', async () => {
    prisma.safeguardingCase.findUnique.mockResolvedValue(null);
    await expect(service.get('nope')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.addEntry('nope', 'NOTE', 'x', 'lead')).rejects.toBeInstanceOf(NotFoundException);
  });
});
