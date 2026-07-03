import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Verification Guard
 * Ensures only verified users (Babalawos) can access certain endpoints
 * NOTE: This is culturally critical - only verified practitioners can offer services
 */
@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.verified) {
      throw new ForbiddenException(
        'This action requires verification. Please complete the verification process.'
      );
    }

    return true;
  }
}
