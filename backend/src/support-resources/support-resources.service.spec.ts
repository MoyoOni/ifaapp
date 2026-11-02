import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportResourcesService } from './support-resources.service';

describe('SupportResourcesService', () => {
  const prisma = {
    supportResource: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn((a) => Promise.resolve({ id: 'r1', ...a.data })),
      update: jest.fn((a) => Promise.resolve({ id: a.where.id, ...a.data })),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const service = new SupportResourcesService(prisma as never);
  beforeEach(() => jest.clearAllMocks());

  it('shows members only active entries', async () => {
    await service.findActive();
    expect(prisma.supportResource.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
  });

  it('needs a phone number or a website, or members cannot reach them', async () => {
    await expect(service.create({ name: 'Somewhere', country: 'Nigeria', helpsWith: 'Grief support' })).rejects.toBeInstanceOf(
      BadRequestException
    );
    await expect(
      service.create({ name: 'Somewhere', country: 'Nigeria', helpsWith: 'Grief support', url: 'https://example.org' })
    ).resolves.toMatchObject({ id: 'r1' });
  });

  it('will not let an edit remove the only way to reach them', async () => {
    prisma.supportResource.findUnique.mockResolvedValue({ id: 'r1', phone: null, url: 'https://example.org' });
    await expect(service.update('r1', { url: '' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s on a missing entry', async () => {
    prisma.supportResource.findUnique.mockResolvedValue(null);
    await expect(service.remove('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
