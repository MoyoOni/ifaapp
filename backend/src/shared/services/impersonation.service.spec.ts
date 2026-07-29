import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ImpersonationService } from './impersonation.service';
import { UserService } from '@/modules/user/user.service';
import { AuditService } from './audit.service';
import { UserRole } from '@common/enums/user-role.enum';

// Zero prior coverage of this service. Written alongside the July 29, 2026
// security fix that removed ADVISORY_BOARD_MEMBER from POST /auth/impersonate
// and tightened canImpersonate() to SUPER-admin-only (it previously also
// accepted the SUPPORT sub-role, contradicting the route's own
// @AdminRoles(AdminSubRole.SUPER) decorator).
describe('ImpersonationService', () => {
  let service: ImpersonationService;
  let userService: { findById: jest.Mock };
  let auditService: { logAction: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const targetUser = { id: 'target-1', email: 'target@iluase.test', role: UserRole.CLIENT };

  beforeEach(async () => {
    userService = { findById: jest.fn().mockResolvedValue(targetUser) };
    auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonationService,
        { provide: UserService, useValue: userService },
        { provide: AuditService, useValue: auditService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(ImpersonationService);
  });

  it('allows a SUPER admin to impersonate', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN, adminSubRole: 'SUPER' };
    const result = await service.initiateImpersonation(admin as any, targetUser.id, 'investigating a support ticket');
    expect(result.token).toBe('signed.jwt.token');
    expect(auditService.logAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'IMPERSONATE_USER', resourceId: targetUser.id })
    );
  });

  it('allows a legacy admin with no adminSubRole set (bootstrap account)', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN };
    await expect(
      service.initiateImpersonation(admin as any, targetUser.id, 'investigating a support ticket')
    ).resolves.toMatchObject({ token: 'signed.jwt.token' });
  });

  it('rejects an ADMIN with the SUPPORT sub-role -- SUPPORT is no longer sufficient', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN, adminSubRole: 'SUPPORT' };
    await expect(
      service.initiateImpersonation(admin as any, targetUser.id, 'investigating a support ticket')
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an ADVISORY_BOARD_MEMBER outright, regardless of any adminSubRole value on the record', async () => {
    const boardMember = {
      id: 'board-1',
      email: 'board@iluase.test',
      role: UserRole.ADVISORY_BOARD_MEMBER,
      adminSubRole: 'SUPER',
    };
    await expect(
      service.initiateImpersonation(boardMember as any, targetUser.id, 'investigating a support ticket')
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a non-admin role entirely', async () => {
    const client = { id: 'client-1', email: 'client@iluase.test', role: UserRole.CLIENT };
    await expect(
      service.initiateImpersonation(client as any, targetUser.id, 'investigating a support ticket')
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects impersonating another admin', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN, adminSubRole: 'SUPER' };
    userService.findById.mockResolvedValueOnce({ id: 'admin-2', role: UserRole.ADMIN });
    await expect(
      service.initiateImpersonation(admin as any, 'admin-2', 'investigating a support ticket')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects impersonating an advisory board member', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN, adminSubRole: 'SUPER' };
    userService.findById.mockResolvedValueOnce({ id: 'board-1', role: UserRole.ADVISORY_BOARD_MEMBER });
    await expect(
      service.initiateImpersonation(admin as any, 'board-1', 'investigating a support ticket')
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a target user that does not exist', async () => {
    const admin = { id: 'admin-1', email: 'admin@iluase.test', role: UserRole.ADMIN, adminSubRole: 'SUPER' };
    userService.findById.mockResolvedValueOnce(null);
    await expect(
      service.initiateImpersonation(admin as any, 'missing-user', 'investigating a support ticket')
    ).rejects.toThrow(BadRequestException);
  });
});
