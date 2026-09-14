import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../cache/redis-cache.service';
import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '@ile-ase/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockRedisCacheService = {
    exists: jest.fn(),
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
    mockRedisCacheService.exists.mockResolvedValue(true);

    await expect(strategy.validate({ ...basePayload, jti: 'revoked-jti' })).rejects.toThrow(
      UnauthorizedException
    );
    expect(mockRedisCacheService.exists).toHaveBeenCalledWith('auth:denylist:revoked-jti');
    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a token whose jti is not denylisted and returns the user with jti/exp passed through', async () => {
    mockRedisCacheService.exists.mockResolvedValue(false);
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

    expect(mockRedisCacheService.exists).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'user-1' });
  });

  it('rejects when the user no longer exists', async () => {
    mockRedisCacheService.exists.mockResolvedValue(false);
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate({ ...basePayload, jti: 'live-jti' })).rejects.toThrow(
      UnauthorizedException
    );
  });
});
