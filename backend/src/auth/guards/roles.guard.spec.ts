import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY, ADMIN_SUB_ROLES_KEY } from './roles.guard';
import { UserRole, AdminSubRole } from '@ile-ase/common';

// This guard now gates admin sub-role scoping on 7 real controllers
// (forum.controller.ts, plus payments/security-audit/subscriptions/
// push-notification/analytics/auth added in P3-15) and previously had
// zero direct test coverage of its own -- every prior verification was
// indirect, at the service layer (see forum-moderation-authz.service.spec.ts).
// This tests the shared mechanism itself once, rather than duplicating
// per-controller DI-heavy suites for every consumer.
describe('RolesGuard', () => {
  let guard: RolesGuard;

  function makeContext(
    handlerMeta: { roles?: UserRole[]; adminSubRoles?: AdminSubRole[] },
    user: any
  ): ExecutionContext {
    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === ROLES_KEY) return handlerMeta.roles;
        if (key === ADMIN_SUB_ROLES_KEY) return handlerMeta.adminSubRoles;
        return undefined;
      },
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('rejects when there is no authenticated user', () => {
    const ctx = makeContext({ roles: [UserRole.ADMIN] }, undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('rejects a user whose base role does not match', () => {
    const ctx = makeContext({ roles: [UserRole.ADMIN] }, { role: UserRole.CLIENT });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows a matching base role when no sub-roles are required', () => {
    const ctx = makeContext({ roles: [UserRole.ADMIN] }, { role: UserRole.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects an ADMIN whose adminSubRole is not in the required list (the P3-15 gap)', () => {
    const ctx = makeContext(
      { roles: [UserRole.ADMIN], adminSubRoles: [AdminSubRole.SUPER, AdminSubRole.FINANCE] },
      { role: UserRole.ADMIN, adminSubRole: AdminSubRole.SUPPORT }
    );
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows an ADMIN whose adminSubRole is in the required list', () => {
    const ctx = makeContext(
      { roles: [UserRole.ADMIN], adminSubRoles: [AdminSubRole.SUPER, AdminSubRole.FINANCE] },
      { role: UserRole.ADMIN, adminSubRole: AdminSubRole.FINANCE }
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('always allows a SUPER admin regardless of the required sub-role list', () => {
    const ctx = makeContext(
      { roles: [UserRole.ADMIN], adminSubRoles: [AdminSubRole.COMPLIANCE] },
      { role: UserRole.ADMIN, adminSubRole: AdminSubRole.SUPER }
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows a legacy/bootstrap ADMIN with no adminSubRole set at all', () => {
    const ctx = makeContext(
      { roles: [UserRole.ADMIN], adminSubRoles: [AdminSubRole.COMPLIANCE] },
      { role: UserRole.ADMIN }
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('does not apply sub-role scoping to a non-ADMIN role permitted by @Roles (the sub-role check only ever runs for role === ADMIN)', () => {
    // Generic guard behavior in isolation. Real routes should not combine a
    // non-ADMIN role in @Roles(...) with an @AdminRoles(...) restriction and
    // expect the sub-role check to apply to that role -- it won't (see the
    // auth/impersonate fix below, where ADVISORY_BOARD_MEMBER was removed
    // from @Roles(...) entirely rather than relying on this guard to scope it).
    const ctx = makeContext(
      {
        roles: [UserRole.ADMIN, UserRole.BABALAWO],
        adminSubRoles: [AdminSubRole.SUPER],
      },
      { role: UserRole.BABALAWO }
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  describe('real decorator metadata on the P3-15 routes', () => {
    // Confirms the @AdminRoles(...) decorators actually landed on the real
    // controller methods this story touched, not just that the guard logic
    // is correct in isolation -- catches a typo'd/misapplied decorator.
    const reflector = new Reflector();

    it.each([
      [
        'PaymentsController.manuallyVerifyPayment',
        () => require('../../payments/payments.controller').PaymentsController,
        'manuallyVerifyPayment',
        [AdminSubRole.SUPER, AdminSubRole.FINANCE, AdminSubRole.COMPLIANCE],
      ],
      [
        'AuthController.impersonate',
        () => require('../auth.controller').AuthController,
        'impersonate',
        [AdminSubRole.SUPER],
      ],
      [
        'AnalyticsController.getOnboardingFunnel',
        () => require('../../analytics/analytics.controller').AnalyticsController,
        'getOnboardingFunnel',
        [AdminSubRole.SUPER],
      ],
    ])('%s carries the expected @AdminRoles metadata', (_label, getCtor, methodName, expected) => {
      const ctor = getCtor();
      const subRoles = reflector.get(ADMIN_SUB_ROLES_KEY, ctor.prototype[methodName]);
      expect(subRoles).toEqual(expected);
    });

    it('AuthController.impersonate only grants @Roles(ADMIN) -- ADVISORY_BOARD_MEMBER was removed, security decision July 29, 2026', () => {
      const { AuthController } = require('../auth.controller');
      const roles = reflector.get(ROLES_KEY, AuthController.prototype.impersonate);
      expect(roles).toEqual([UserRole.ADMIN]);
    });
  });
});
