import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';

@Injectable()
export class AdminSubRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('admin-sub-roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific sub-role required
    }
    
    const { user } = context.switchToHttp().getRequest<{ user: User }>();
    
    // Only allow if user is an admin with the required sub-role
    if (user.role !== 'ADMIN') {
      return false;
    }
    
    // SUPER role has access to everything
    if (user.adminSubRole === 'SUPER') {
      return true;
    }
    
    // Check if user has one of the required sub-roles
    return requiredRoles.some(role => user.adminSubRole === role);
  }
}