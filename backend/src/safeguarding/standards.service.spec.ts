import { ForbiddenException } from '@nestjs/common';
import { StandardsService } from './standards.service';
import { PRACTITIONER_STANDARDS } from './standards';

// docs/safeguarding SAFE-12
describe('StandardsService', () => {
  const prisma = { user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) } };
  const service = new StandardsService(prisma as never);
  beforeEach(() => jest.clearAllMocks());

  it('requires Babalawos and vendors, not members', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'BABALAWO', standardsVersionAccepted: null });
    await expect(service.status('u1')).resolves.toMatchObject({ required: true, accepted: false });
    prisma.user.findUnique.mockResolvedValue({ role: 'CLIENT', standardsVersionAccepted: null });
    await expect(service.status('u1')).resolves.toMatchObject({ required: false });
  });

  it('counts only the current version as accepted', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'VENDOR', standardsVersionAccepted: 'an-older-version' });
    await expect(service.status('u1')).resolves.toMatchObject({ accepted: false, acceptedAt: null });
    await expect(service.assertAccepted('u1')).rejects.toBeInstanceOf(ForbiddenException);
    prisma.user.findUnique.mockResolvedValue({ role: 'VENDOR', standardsVersionAccepted: PRACTITIONER_STANDARDS.version, standardsAcceptedAt: new Date() });
    await expect(service.assertAccepted('u1')).resolves.toBeUndefined();
  });

  it('records the version and time accepted, and refuses a stale version', async () => {
    await expect(service.accept('u1', 'an-older-version')).rejects.toBeInstanceOf(ForbiddenException);
    prisma.user.findUnique.mockResolvedValue({ role: 'BABALAWO', standardsVersionAccepted: PRACTITIONER_STANDARDS.version });
    await service.accept('u1', PRACTITIONER_STANDARDS.version);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { standardsVersionAccepted: PRACTITIONER_STANDARDS.version, standardsAcceptedAt: expect.any(Date) },
    });
  });
});
