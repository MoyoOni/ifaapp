import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '@/prisma/prisma.service';

// ProBacklog-v1.md item #12 (soft-delete audit): remove() had zero
// ownership/role check on a hard User delete. Currently dead code (no
// callers anywhere in the codebase), but this closes the gap before it's
// ever wired up to a route.
describe('UserService.remove - authz gap', () => {
  let service: UserService;

  const mockPrismaService = {
    user: { delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('rejects a non-admin caller without ever touching the database', async () => {
    const nonAdmin = { id: 'user-1', role: 'CLIENT' } as any;

    await expect(service.remove('target-1', nonAdmin)).rejects.toThrow(ForbiddenException);
    expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
  });

  it('allows an admin caller to delete the target user', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN' } as any;
    mockPrismaService.user.delete.mockResolvedValue({ id: 'target-1' });

    await service.remove('target-1', admin);

    expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: 'target-1' } });
  });

  it('translates a missing user (P2025) into NotFoundException', async () => {
    const admin = { id: 'admin-1', role: 'ADMIN' } as any;
    mockPrismaService.user.delete.mockRejectedValue({ code: 'P2025' });

    await expect(service.remove('target-1', admin)).rejects.toThrow(NotFoundException);
  });
});
