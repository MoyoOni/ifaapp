import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { PrismaService } from '../prisma/prisma.service';
import { SafeguardingCasesService } from '../safeguarding/cases.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { isUndeliverable } from '../shared/services/ses-email.service';

// Code-health pass (November 6, 2026): export and erasure had no tests.
describe('GdprService', () => {
  let service: GdprService;
  const tx = {
    user: { update: jest.fn() },
    forumPost: { updateMany: jest.fn() },
    forumThread: { updateMany: jest.fn() },
    message: { deleteMany: jest.fn() },
    babalawoReview: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const many = () => ({ findMany: jest.fn().mockResolvedValue([]) });
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    appointment: many(),
    certificate: many(),
    babalawoReview: many(),
    message: many(),
    wallet: { findUnique: jest.fn().mockResolvedValue(null) },
    transaction: many(),
    notification: many(),
    forumThread: many(),
    forumPost: many(),
    subscription: many(),
    payment: many(),
    $transaction: jest.fn<Promise<unknown>, [(t: typeof tx) => unknown]>((fn) =>
      Promise.resolve(fn(tx))
    ),
  };
  const cases = { openCasesInvolving: jest.fn(), addEntry: jest.fn() };

  const member = {
    id: 'm-1',
    sub: 'm-1',
    email: 'ade@example.com',
    role: 'CLIENT',
  } as CurrentUserPayload;
  const admin = {
    id: 'a-1',
    sub: 'a-1',
    email: 'admin@example.com',
    role: 'ADMIN',
  } as CurrentUserPayload;

  beforeEach(async () => {
    jest.clearAllMocks();
    cases.openCasesInvolving.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: PrismaService, useValue: prisma },
        { provide: SafeguardingCasesService, useValue: cases },
      ],
    }).compile();
    service = module.get(GdprService);
  });

  describe('exportUserData', () => {
    it('returns the profile with every related section, scoped to the user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'm-1', email: 'ade@example.com' });
      const data = await service.exportUserData('m-1');
      expect(Object.keys(data)).toEqual(
        expect.arrayContaining([
          'user',
          'messagesSent',
          'messagesReceived',
          'payments',
          'forumPosts',
          'wallet',
        ])
      );
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { senderId: 'm-1' } })
      );
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'm-1' } })
      );
    });

    it('never exports the password hash or tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'm-1' });
      await service.exportUserData('m-1');
      const select = prisma.user.findUnique.mock.calls[0][0].select;
      expect(select.passwordHash).toBeUndefined();
      expect(select.emailVerificationToken).toBeUndefined();
      expect(select.googleId).toBeUndefined();
    });

    it('400s for an unknown user and wraps database errors', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.exportUserData('x')).rejects.toThrow('User not found');
      prisma.user.findUnique.mockRejectedValue(new Error('connection lost'));
      await expect(service.exportUserData('x')).rejects.toThrow(/Could not export user data/);
    });
  });

  describe('deleteUser (erasure)', () => {
    beforeEach(() =>
      prisma.user.findUnique.mockResolvedValue({ id: 'm-1', email: 'ade@example.com', name: 'Adé' })
    );

    it('anonymises the account so it can never be signed into again', async () => {
      await service.deleteUser('m-1', member);
      const data = tx.user.update.mock.calls[0][0].data;
      expect(data).toMatchObject({
        name: '[Deleted User]',
        passwordHash: '',
        googleId: null,
        slug: null,
        phone: null,
      });
      expect(data.sessionsRevokedAt).toBeInstanceOf(Date);
      expect(data.email).toMatch(/^deleted_\d+_m-1@deleted\.iluase\.invalid$/);
      expect(isUndeliverable(data.email)).toBe(true);
    });

    it('blanks their posts, threads and reviews, deletes their messages and audits it', async () => {
      await service.deleteUser('m-1', member);
      expect(tx.forumPost.updateMany).toHaveBeenCalledWith({
        where: { authorId: 'm-1' },
        data: { content: '[Content from deleted account]' },
      });
      expect(tx.forumThread.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: 'm-1' } })
      );
      expect(tx.message.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ senderId: 'm-1' }, { receiverId: 'm-1' }] },
      });
      expect(tx.babalawoReview.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: 'm-1' } })
      );
      expect(tx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_DATA_DELETION_REQUEST',
            resourceId: 'm-1',
          }),
        })
      );
    });

    it('SAFE-06: holds erasure while a safeguarding case is open, without telling the member why', async () => {
      cases.openCasesInvolving.mockResolvedValue([{ id: 'c-1', ref: 'SG-0007' }]);
      const err = await service.deleteUser('m-1', member).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).not.toMatch(/SG-|safeguarding/i);
      expect(cases.addEntry).toHaveBeenCalledWith(
        'c-1',
        'MEASURE',
        expect.stringContaining('legal hold'),
        'm-1'
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('SAFE-06: an admin is told which case is holding it', async () => {
      cases.openCasesInvolving.mockResolvedValue([{ id: 'c-1', ref: 'SG-0007' }]);
      await expect(service.deleteUser('m-1', admin)).rejects.toThrow(/SG-0007/);
    });

    it('400s for an unknown user and wraps transaction failures', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteUser('x', admin)).rejects.toThrow(BadRequestException);
      prisma.user.findUnique.mockResolvedValue({ id: 'm-1' });
      prisma.$transaction.mockRejectedValueOnce(new Error('deadlock'));
      await expect(service.deleteUser('m-1', admin)).rejects.toThrow(
        /Could not delete user account/
      );
    });
  });

  describe('consent preferences', () => {
    it('only writes the forum digest flag', async () => {
      prisma.user.update.mockResolvedValue({ id: 'm-1', forumDigestOptIn: false });
      await service.updateConsentPreferences('m-1', { forumDigest: false, marketingEmails: true });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { forumDigestOptIn: false } })
      );
    });

    it('reads them back', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'm-1',
        email: 'e',
        name: 'n',
        forumDigestOptIn: true,
        createdAt: new Date(0),
      });
      await expect(service.getConsentPreferences('m-1')).resolves.toMatchObject({
        forumDigest: true,
      });
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getConsentPreferences('x')).rejects.toThrow(BadRequestException);
    });
  });
});

describe('isUndeliverable', () => {
  it.each([
    ['deleted_1_x@deleted.iluase.invalid', true],
    ['someone@example.com', true],
    ['someone@mail.example.org', true],
    ['a@host.test', true],
    ['success+tag@simulator.amazonses.com', false],
    ['ade@gmail.com', false],
    ['ade@notexample.com', false],
  ])('%s → %s', (to, expected) => expect(isUndeliverable(to)).toBe(expected));
});
