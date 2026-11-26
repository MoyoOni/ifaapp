import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService, SessionStoreUnavailableException } from '../../cache/redis-cache.service';
import { JwtStrategy, accountBlock } from './jwt.strategy';
import { UserRole } from '@ile-ase/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRedisCacheService = {
    existsStrict: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-at-least-32-characters-long'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisCacheService, useValue: mockRedisCacheService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  const basePayload = {
    sub: 'user-1',
    email: 'test@example.com',
    role: UserRole.CLIENT,
    verified: true,
  };

  it('rejects a token whose jti is on the revocation denylist, without looking up the user', async () => {
    mockRedisCacheService.existsStrict.mockResolvedValue(true);

    await expect(strategy.validate({ ...basePayload, jti: 'revoked-jti' })).rejects.toThrow(
      UnauthorizedException
    );
    expect(mockRedisCacheService.existsStrict).toHaveBeenCalledWith('auth:denylist:revoked-jti');
    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a token whose jti is not denylisted and returns the user with jti/exp passed through', async () => {
    mockRedisCacheService.existsStrict.mockResolvedValue(false);
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.CLIENT,
      verified: true,
      adminSubRole: null,
    });

    const result = await strategy.validate({ ...basePayload, jti: 'live-jti', exp: 123456 });

    expect(result).toMatchObject({ id: 'user-1', jti: 'live-jti', exp: 123456 });
  });

  it('does not check the denylist (and does not blow up) for a token with no jti', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: UserRole.CLIENT,
      verified: true,
      adminSubRole: null,
    });

    const result = await strategy.validate({ ...basePayload });

    expect(mockRedisCacheService.existsStrict).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'user-1' });
  });

  it('fails closed (503) when Redis cannot say whether the token is revoked', async () => {
    mockRedisCacheService.existsStrict.mockRejectedValue(new SessionStoreUnavailableException());

    await expect(strategy.validate({ ...basePayload, jti: 'any-jti' })).rejects.toBeInstanceOf(SessionStoreUnavailableException);
    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('passes the impersonating admin through, so JwtAuthGuard keeps isImpersonated (it was reset to false)', async () => {
    mockRedisCacheService.existsStrict.mockResolvedValue(false);
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: UserRole.CLIENT, verified: true });

    const result = await strategy.validate({
      ...basePayload, jti: 'imp-jti', isImpersonated: true, impersonatedBy: 'admin-9', impersonatedByEmail: 'admin@iluase.test',
    });

    expect(result).toMatchObject({ isImpersonated: true, impersonatedBy: 'admin-9', impersonatorId: 'admin-9', jti: 'imp-jti' });
    const { ImpersonationService } = await import('../../shared/services/impersonation.service');
    const info = new ImpersonationService({} as any, {} as any, {} as any).getImpersonationInfo(result);
    expect(info).toEqual({ isImpersonated: true, impersonatedBy: 'admin-9', impersonatedByEmail: 'admin@iluase.test' });
  });

  it('rejects when the user no longer exists', async () => {
    mockRedisCacheService.existsStrict.mockResolvedValue(false);
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ ...basePayload, jti: 'live-jti' })).rejects.toThrow(
      UnauthorizedException
    );
  });

  describe('banned and suspended accounts (enforced from November 6, 2026)', () => {
    const user = { id: 'user-1', email: 'test@example.com', role: UserRole.CLIENT, verified: true, adminSubRole: null };

    it('rejects every request from a banned account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...user, bannedAt: new Date() });
      await expect(strategy.validate(basePayload)).rejects.toThrow(/banned/);
    });

    it('rejects requests while a suspension runs, and lets them through once it has ended', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...user, suspendedUntil: new Date(Date.now() + 86_400_000) });
      await expect(strategy.validate(basePayload)).rejects.toThrow(/suspended until/);

      mockPrismaService.user.findUnique.mockResolvedValue({ ...user, suspendedUntil: new Date(Date.now() - 1000) });
      await expect(strategy.validate(basePayload)).resolves.toMatchObject({ id: 'user-1' });
    });

    it('ends tokens issued before an admin force-logout, but not ones issued after', async () => {
      const revokedAt = new Date('2026-11-06T10:00:00Z');
      const before = Math.floor(revokedAt.getTime() / 1000) - 60;
      mockPrismaService.user.findUnique.mockResolvedValue({ ...user, sessionsRevokedAt: revokedAt });
      await expect(strategy.validate({ ...basePayload, iat: before })).rejects.toThrow(/administrator/);
      await expect(strategy.validate({ ...basePayload, iat: before + 120 })).resolves.toMatchObject({ id: 'user-1' });
    });

    it('accountBlock: null for an ordinary account', () => {
      expect(accountBlock({})).toBeNull();
      expect(accountBlock({ bannedAt: null, suspendedUntil: null })).toBeNull();
    });
  });
});
