import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, AdminSubRole } from '@ile-ase/common';

export const ROLES_KEY = 'roles';
export const ADMIN_SUB_ROLES_KEY = 'admin_sub_roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const AdminRoles = (...subRoles: AdminSubRole[]) =>
  SetMetadata(ADMIN_SUB_ROLES_KEY, subRoles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredSubRoles = this.reflector.getAllAndOverride<AdminSubRole[]>(ADMIN_SUB_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Base Role Check: If user doesn't have the primary role required, reject.
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => user.role === role);
      if (!hasRole) return false;
    }

    // Granular Admin Sub-role Check:
    // If we're hitting an admin route and specific sub-roles are required
    if (user.role === UserRole.ADMIN && requiredSubRoles && requiredSubRoles.length > 0) {
      // SUPER admin always bypasses sub-role restrictions
      if (user.adminSubRole === AdminSubRole.SUPER) return true;

      const hasSubRole = requiredSubRoles.includes(user.adminSubRole as AdminSubRole);
      return hasSubRole;
    }

    // Default to success if primary role check passed and no sub-roles were specified
    return true;
  }
}
