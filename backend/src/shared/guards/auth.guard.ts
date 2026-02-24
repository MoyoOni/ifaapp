import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ImpersonationService } from '../services/impersonation.service';
import { Request } from 'express';

export interface ExtendedUser {
  id: string;
  email: string;
  role: string;
  verified: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
  impersonatedByEmail?: string;
  [key: string]: any; // Allow other properties
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly impersonationService: ImpersonationService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Bypass authentication for public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user: any = request.user;

    // Add impersonation info to user object if present
    if (user) {
      const impersonationInfo = this.impersonationService.getImpersonationInfo(user);
      (user as ExtendedUser).isImpersonated = impersonationInfo.isImpersonated;
      (user as ExtendedUser).impersonatedBy = impersonationInfo.impersonatedBy;
      (user as ExtendedUser).impersonatedByEmail = impersonationInfo.impersonatedByEmail;
    }

    return true;
  }
}