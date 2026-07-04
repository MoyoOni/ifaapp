import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStage, VendorStatus, AdminSubRole } from '@ile-ase/common';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ApproveVerificationDto } from './dto/approve-verification.dto';
import { BulkVerifyDto } from './dto/bulk-verify.dto';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  /**
   * Get All Users (Admin only)
   */
  async getAllUsers(
    currentUser: CurrentUserPayload,
    filters?: { role?: string; verified?: boolean }
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view all users');
    }

    const where: Record<string, unknown> = {};
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        hasOnboarded: true,
        culturalLevel: true,
      },
      orderBy: { name: 'asc' },
    });

    return users;
  }

  /**
   * Get Verification Applications for Review
   */
  async getVerificationApplications(currentUser: CurrentUserPayload, stage?: VerificationStage) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can review verification applications');
    }

    const where = stage ? { currentStage: stage } : {};

    const applications = await this.prisma.verificationApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        history: {
          orderBy: { timestamp: 'desc' },
          take: 5, // Latest 5 status updates
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return applications;
  }

  /**
   * Approve verification application
   */
  async approveVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve verification applications');
    }

    const application = await this.prisma.verificationApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    // Update application status
    const updatedApplication = await this.prisma.verificationApplication.update({
      where: { id },
      data: {
        approvedById: currentUser.id,
        approvedAt: new Date(),
        currentStage: 'APPROVED' as VerificationStage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update user verification status
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        verified: true,
        role: 'BABALAWO', // Promote to Babalawo after verification
      },
    });

    // Send notification to user
    await this.notificationService.createNotification({
      userId: application.userId,
      type: NotificationType.VERIFICATION,
      category: NotificationCategory.SUCCESS,
      title: 'Verification Approved',
      message: `Your ${application.lineage} verification has been approved.`,
      sendEmail: true,
      sendPush: true,
    });

    return updatedApplication;
  }

  /**
   * Reject verification application
   */
  async rejectVerification(
    id: string,
    dto: ApproveVerificationDto,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can reject verification applications');
    }

    const application = await this.prisma.verificationApplication.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Verification application not found');
    }

    // Update application status
    const updatedApplication = await this.prisma.verificationApplication.update({
      where: { id },
      data: {
        rejectedById: currentUser.id,
        rejectedAt: new Date(),
        rejectionReason: dto.reason || 'Application rejected by admin',
        currentStage: 'REJECTED' as VerificationStage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification to user
    await this.notificationService.createNotification({
      userId: application.userId,
      type: NotificationType.VERIFICATION,
      category: NotificationCategory.ERROR,
      title: 'Verification Rejected',
      message: `Your ${application.lineage} verification has been rejected. Reason: ${dto.reason}`,
      sendEmail: true,
      sendPush: true,
    });

    return updatedApplication;
  }

  /**
   * Bulk approve or decline verification applications
   */
  async bulkVerifyApplications(dto: BulkVerifyDto, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can bulk-verify applications');
    }
    if (!dto.appIds.length) {
      throw new BadRequestException('No application IDs provided');
    }

    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const appId of dto.appIds) {
      try {
        const application = await this.prisma.verificationApplication.findUnique({
          where: { id: appId },
        });
        if (!application) {
          results.push({ id: appId, success: false, error: 'Not found' });
          continue;
        }

        if (dto.action === 'approve') {
          await this.prisma.verificationApplication.update({
            where: { id: appId },
            data: {
              approvedById: currentUser.id,
              approvedAt: new Date(),
              currentStage: 'APPROVED' as VerificationStage,
            },
          });
          await this.prisma.user.update({
            where: { id: application.userId },
            data: { verified: true, role: 'BABALAWO' },
          });
          await this.notificationService.createNotification({
            userId: application.userId,
            type: NotificationType.VERIFICATION,
            category: NotificationCategory.SUCCESS,
            title: 'Verification Approved',
            message: dto.note
              ? `Your verification has been approved. Note: ${dto.note}`
              : 'Your verification has been approved.',
            sendEmail: true,
            sendPush: true,
          });
        } else {
          await this.prisma.verificationApplication.update({
            where: { id: appId },
            data: {
              rejectedById: currentUser.id,
              rejectedAt: new Date(),
              rejectionReason: dto.note || 'Application declined by admin',
              currentStage: 'REJECTED' as VerificationStage,
            },
          });
          await this.notificationService.createNotification({
            userId: application.userId,
            type: NotificationType.VERIFICATION,
            category: NotificationCategory.ERROR,
            title: 'Verification Declined',
            message: dto.note
              ? `Your verification has been declined. Reason: ${dto.note}`
              : 'Your verification application has been declined.',
            sendEmail: true,
            sendPush: true,
          });
        }

        results.push({ id: appId, success: true });
      } catch (err) {
        this.logger.error(`Bulk verify failed for app ${appId}`, err);
        results.push({ id: appId, success: false, error: (err as Error).message });
      }
    }

    return { processed: results.length, results };
  }

  /**
   * Get pending vendor applications for cultural vetting
   */
  async getPendingVendors(currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view vendor applications');
    }

    const vendors = await this.prisma.vendor.findMany({
      where: {
        status: VendorStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vendors;
  }

  /**
   * Review vendor application with cultural vetting
   */
  async reviewVendorApplication(
    vendorId: string,
    dto: { approved: boolean; culturalAuthenticityNotes?: string; rejectionReason?: string },
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can review vendor applications');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor application not found');
    }

    if (vendor.status !== VendorStatus.PENDING) {
      throw new BadRequestException('Vendor application is not pending');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: dto.approved ? VendorStatus.APPROVED : VendorStatus.REJECTED,
        verifiedAt: dto.approved ? new Date() : null,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        culturalAuthenticityNotes: dto.culturalAuthenticityNotes,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Vendor application ${vendorId} ${dto.approved ? 'approved' : 'rejected'} by admin ${currentUser.id}`
    );

    return updated;
  }

  async impersonateUser(currentUser: CurrentUserPayload, targetUserId: string, reason: string) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can impersonate users');
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException(
        'A valid reason with at least 10 characters is required for impersonation'
      );
    }

    // Fetch target user details
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Log the impersonation action for audit purposes
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'IMPERSONATE_USER',
      entityType: 'USER',
      entityId: targetUserId,
      reason,
      payload: {
        targetUserId,
        targetUserEmail: targetUser.email,
        reason,
        impersonatorId: currentUser.id,
        impersonatorEmail: currentUser.email,
        timestamp: new Date(),
      },
    });

    // For security reasons, we won't return actual user credentials here
    // Instead, we'll return a confirmation that the impersonation was logged
    return {
      impersonationLogged: true,
      targetUserId,
      reason,
      impersonationStartedAt: new Date(),
    };
  }

  /**
   * Create or update admin user with specific sub-role
   */
  async createOrUpdateAdmin(
    currentUser: CurrentUserPayload,
    userData: {
      email: string;
      name: string;
      adminSubRole: string;
      sendInvite?: boolean;
    }
  ) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can manage admin accounts');
    }

    // Validate admin sub-role
    const validRoles = Object.values(AdminSubRole);
    if (!validRoles.includes(userData.adminSubRole as AdminSubRole)) {
      throw new BadRequestException(
        `Invalid admin sub-role. Valid roles are: ${validRoles.join(', ')}`
      );
    }

    // Find existing admin user by email
    let adminUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    let isNewUser = false;
    if (adminUser) {
      // Update existing admin user
      adminUser = await this.prisma.user.update({
        where: { email: userData.email },
        data: {
          role: 'ADMIN',
          adminSubRole: userData.adminSubRole as AdminSubRole,
          // If sendInvite is true, we could trigger an invitation workflow here
        },
      });
    } else {
      // Create new admin user with a default password hash
      // In a real system, this would trigger an invite workflow
      adminUser = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash:
            '$2b$10$EPa7knPqKUe9gVDKYr0B7O.HKeVw9dY.WiUeZcUeZcUeZcUeZcUeZcUeZcUeZcUeZcUeZcUeZcUeZcUeZ', // Placeholder bcrypt hash for "temporary_password"
          role: 'ADMIN',
          adminSubRole: userData.adminSubRole as AdminSubRole,
          // If sendInvite is true, we could trigger an invitation workflow here
        },
      });
      isNewUser = true;
    }

    // Log the admin creation/update
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: isNewUser ? 'ADMIN_USER_CREATED' : 'ADMIN_USER_UPDATED',
      entityType: 'USER',
      entityId: adminUser.id,
      reason: isNewUser ? 'New admin user created' : 'Existing admin updated',
      payload: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        adminSubRole: adminUser.adminSubRole,
        updatedBy: currentUser.id,
        updatedByEmail: currentUser.email,
      },
    });

    return adminUser;
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(currentUser: CurrentUserPayload, filters?: { adminSubRole?: string }) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can view admin accounts');
    }

    const where: Record<string, unknown> = { role: 'ADMIN' };
    if (filters?.adminSubRole) {
      where.adminSubRole = filters.adminSubRole;
    }

    const admins = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        adminSubRole: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return admins;
  }

  /**
   * Remove admin privileges from user
   */
  async removeAdminPrivileges(currentUser: CurrentUserPayload, userId: string) {
    if (currentUser.role !== 'ADMIN' || currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can remove admin privileges');
    }

    if (currentUser.id === userId) {
      throw new BadRequestException('Admins cannot remove their own admin privileges');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'CLIENT', // Demote to client
        adminSubRole: null,
      },
    });

    // Log the removal
    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'ADMIN_PRIVILEGES_REMOVED',
      entityType: 'USER',
      entityId: userId,
      reason: 'Admin privileges removed by super admin',
      payload: {
        previousRole: 'ADMIN',
        previousAdminSubRole: user.adminSubRole,
        newRole: 'CLIENT',
        newAdminSubRole: null,
        removedBy: currentUser.id,
        removedByEmail: currentUser.email,
      },
    });

    return updatedUser;
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({ where: { userId }, orderBy: { loginAt: 'desc' }, take: 20 });
  }

  async forceLogoutUser(userId: string) {
    await this.prisma.userSession.updateMany({ where: { userId, isActive: true }, data: { isActive: false, loggedOutAt: new Date() } });
    return { success: true, message: 'All sessions invalidated' };
  }

  async getRecentLogins(limit = 50) {
    return this.prisma.userSession.findMany({
      orderBy: { loginAt: 'desc' }, take: limit,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  // ADM-028: Cultural Orientation Quiz Management

  async getInactivePractitioners(currentUser: any, _daysInactive: number): Promise<any[]> {
    return this.prisma.user.findMany({
      where: { role: 'BABALAWO' },
      select: { id: true, name: true, email: true, isOnLeave: true, isDeactivated: true },
    });
  }

  async getLifecycleAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [totalUsers, newLast30, activeClients, activeBabalawos, activeVendors,
      completedAppointments, totalRevenue, passedOrientation] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: 'BABALAWO' } }),
      this.prisma.user.count({ where: { role: 'VENDOR' } }),
      this.prisma.appointment.count({ where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      this.prisma.user.count({ where: { passedCulturalOrientation: true } }),
    ]);

    const prevNewUsers = await this.prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
    const growthRate = prevNewUsers > 0 ? Math.round(((newLast30 - prevNewUsers) / prevNewUsers) * 100) : 0;

    // Monthly cohort — signups by month for last 6 months
    const cohorts = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const signups = await this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } });
      const converted = await this.prisma.appointment.count({
        where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
      });
      cohorts.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        signups, converted,
        conversionRate: signups > 0 ? Math.round((converted / signups) * 100) : 0,
      });
    }

    return {
      overview: {
        totalUsers, newLast30, growthRate,
        activeClients, activeBabalawos, activeVendors,
        completedConsultations: completedAppointments,
        revenueThisMonth: totalRevenue._sum.amount ?? 0,
        culturalOrientationPassed: passedOrientation,
        orientationRate: totalUsers > 0 ? Math.round((passedOrientation / totalUsers) * 100) : 0,
      },
      cohorts,
    };
  }

  /**
   * Log PII reveal action
   * Used when admin reveals sensitive personal information
   */
  async logPiiReveal(
    adminUserId: string,
    entityType: string,
    entityId: string,
    fieldLabel: string,
    reason: string
  ): Promise<void> {
    this.logger.log(`Logging PII reveal for ${entityType}:${entityId} by admin ${adminUserId}`);

    // Log the action in the audit trail
    await this.auditService.logAction({
      adminId: adminUserId,
      action: 'REVEAL_PII',
      entityType,
      entityId,
      reason,
      payload: {
        fieldLabel,
        reason,
        piiReveal: true,
      },
    });
  }

}
