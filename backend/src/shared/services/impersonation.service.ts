import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/user/user.service';
import { AuditService } from './audit.service';
import { User } from '@prisma/client';
import { UserRole } from '@common/enums/user-role.enum';

export interface ImpersonationResult {
  token: string;
  originalUser: User;
  impersonatedUser: User;
}

@Injectable()
export class ImpersonationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly auditService: AuditService,
  ) {}

  async initiateImpersonation(
    adminUser: User,
    targetUserId: string,
    reason: string,
  ): Promise<ImpersonationResult> {
    // Verify admin user has proper permissions
    if (!this.canImpersonate(adminUser)) {
      throw new UnauthorizedException('Insufficient permissions to impersonate users');
    }

    // Verify target user exists
    const targetUser = await this.userService.findById(targetUserId);
    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    // Prevent impersonating other admins
    if (this.isUserAdmin(targetUser)) {
      throw new BadRequestException('Cannot impersonate other administrative users');
    }

    // Log the impersonation action
    await this.auditService.logAction({
      adminId: adminUser.id,
      action: 'IMPERSONATE_USER',
      entityType: 'USER',
      entityId: targetUserId,
      reason,
      payload: {
        impersonatedUserId: targetUserId,
        impersonation: true,
      },
    });

    // Generate impersonation token
    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonated: true,
      impersonatedBy: adminUser.id,
      impersonatedByEmail: adminUser.email,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '30m', // Short-lived token for security
    });

    return {
      token,
      originalUser: adminUser,
      impersonatedUser: targetUser,
    };
  }

  private canImpersonate(user: User): boolean {
    // Admins and super admins can impersonate users
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has specific admin sub-role that permits impersonation
    if (user.adminSubRole) {
      return ['SUPER', 'SUPPORT'].includes(user.adminSubRole);
    }

    return false;
  }

  private isUserAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN || 
           user.role === UserRole.ADVISORY_BOARD_MEMBER;
  }

  /**
   * Verify if a token is an impersonation token
   */
  isImpersonationToken(payload: any): boolean {
    return payload.isImpersonated === true && !!payload.impersonatedBy;
  }

  /**
   * Get impersonation info from token payload
   */
  getImpersonationInfo(payload: any): { 
    isImpersonated: boolean; 
    impersonatedBy?: string;
    impersonatedByEmail?: string;
  } {
    if (this.isImpersonationToken(payload)) {
      return {
        isImpersonated: true,
        impersonatedBy: payload.impersonatedBy,
        impersonatedByEmail: payload.impersonatedByEmail,
      };
    }
    
    return {
      isImpersonated: false,
    };
  }
}