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
import { SuspendUserDto } from './dto/suspend-user.dto';
import { WarnUserDto } from './dto/warn-user.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { UnbanUserDto } from './dto/unban-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
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
        adminSubRole: true,
        verified: true,
        hasOnboarded: true,
        culturalLevel: true,
        createdAt: true,
        suspendedUntil: true,
        bannedAt: true,
        banReason: true,
        warnCount: true,
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    // isBanned/isSuspended have no dedicated columns -- they're derived from
    // bannedAt/suspendedUntil here so the frontend doesn't need to know the
    // underlying schema (and a suspension quietly expires once its date passes).
    return users.map((user) => ({
      ...user,
      isBanned: !!user.bannedAt,
      isSuspended: !user.bannedAt && !!user.suspendedUntil && user.suspendedUntil > now,
    }));
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
    return this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      take: 20,
    });
  }

  async forceLogoutUser(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, loggedOutAt: new Date() },
    });
    return { success: true, message: 'All sessions invalidated' };
  }

  async getRecentLogins(limit = 50) {
    return this.prisma.userSession.findMany({
      orderBy: { loginAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  // ADM-028: Cultural Orientation Quiz Management

  // _currentUser: not used for authorization here -- this is only ever called
  // internally (by the AdminService facade and the inactive-practitioner cron
  // monitor, which passes a synthetic system user), never from a controller
  // route directly.
  async getInactivePractitioners(admin: CurrentUserPayload, daysThreshold: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Find practitioners who have had no appointments or sessions in the last X days
    // We'll need to get all babalawos and check their activity separately
    const practitioners = await this.prisma.user.findMany({
      where: {
        role: 'BABALAWO',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        trustScore: true,
        createdAt: true,
        isOnLeave: true,
        isDeactivated: true,
        appointmentsAsBabalawo: {
          where: {
            date: { gte: cutoffDate.toISOString() },
          },
          take: 1,
        },
        userSessions: {
          where: {
            lastSeenAt: { gte: cutoffDate.toISOString() },
          },
          orderBy: { lastSeenAt: 'desc' },
          take: 1,
        },
      },
    });

    // Filter for those who have neither recent appointments nor sessions
    const inactivePractitioners = [];
    for (const p of practitioners) {
      const hasRecentAppointment = p.appointmentsAsBabalawo.length > 0;
      const hasRecentSession = p.userSessions.length > 0;

      if (!hasRecentAppointment && !hasRecentSession) {
        // Get the last session overall for calculating days since activity
        const lastOverallSession = await this.prisma.userSession.findFirst({
          where: { userId: p.id },
          orderBy: { lastSeenAt: 'desc' },
        });

        inactivePractitioners.push({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
          trustScore: p.trustScore || 0,
          createdAt: p.createdAt,
          isOnLeave: p.isOnLeave,
          isDeactivated: p.isDeactivated,
          lastAppointmentAt: null, // We already know they don't have recent appointments
          lastSessionAt: lastOverallSession?.lastSeenAt || null,
          daysSinceLastActivity: lastOverallSession
            ? Math.floor(
                (new Date().getTime() - new Date(lastOverallSession.lastSeenAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 999,
        });
      }
    }

    return inactivePractitioners;
  }

  async reEngagePractitioner(practitionerId: string, action: string, message?: string) {
    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId, role: 'BABALAWO' },
    });
    if (!practitioner) throw new NotFoundException('Practitioner not found');

    switch (action) {
      case 'send-message':
        // Use NotificationService to send message
        // For now, just log
        break;
      case 'mark-on-leave':
        await this.prisma.user.update({
          where: { id: practitionerId },
          data: { isOnLeave: true },
        });
        break;
      case 'deactivate':
        await this.prisma.user.update({
          where: { id: practitionerId },
          data: { isDeactivated: true },
        });
        break;
      default:
        throw new BadRequestException('Invalid action');
    }
    return { success: true };
  }

  async reactivatePractitioner(practitionerId: string) {
    const practitioner = await this.prisma.user.findUnique({
      where: { id: practitionerId, role: 'BABALAWO' },
    });
    if (!practitioner) throw new NotFoundException('Practitioner not found');

    await this.prisma.user.update({
      where: { id: practitionerId },
      data: { isOnLeave: false, isDeactivated: false },
    });
    return { success: true };
  }

  async getLifecycleAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newLast30,
      activeClients,
      activeBabalawos,
      activeVendors,
      completedAppointments,
      totalRevenue,
      passedOrientation,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { role: 'BABALAWO' } }),
      this.prisma.user.count({ where: { role: 'VENDOR' } }),
      this.prisma.appointment.count({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { passedCulturalOrientation: true } }),
    ]);

    const prevNewUsers = await this.prisma.user.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const growthRate =
      prevNewUsers > 0 ? Math.round(((newLast30 - prevNewUsers) / prevNewUsers) * 100) : 0;

    // Monthly cohort — signups by month for last 6 months
    const cohorts = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const signups = await this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      const converted = await this.prisma.appointment.count({
        where: { createdAt: { gte: start, lte: end }, status: 'COMPLETED' },
      });
      cohorts.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        signups,
        converted,
        conversionRate: signups > 0 ? Math.round((converted / signups) * 100) : 0,
      });
    }

    return {
      overview: {
        totalUsers,
        newLast30,
        growthRate,
        activeClients,
        activeBabalawos,
        activeVendors,
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

  /**
   * Guards shared by the moderation actions below: an admin can't apply
   * suspend/warn/ban to themselves (accidental self-lockout), and can't
   * apply it to another admin through this generic endpoint (role changes
   * on admins go through the dedicated admin-management flow instead).
   */
  private assertModerationTarget(
    currentUser: CurrentUserPayload,
    target: { id: string; role: string }
  ) {
    if (target.id === currentUser.id) {
      throw new BadRequestException('You cannot apply moderation actions to your own account');
    }
    if (target.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admins cannot be suspended, warned, or banned through this action'
      );
    }
  }

  /**
   * ADM-003: Suspend a user for a fixed number of days
   */
  async suspendUser(currentUser: CurrentUserPayload, userId: string, dto: SuspendUserDto) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can suspend users');
    }

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertModerationTarget(currentUser, target);

    const durationDays = dto.durationDays ?? 7;
    const suspendedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil },
      select: { id: true, email: true, name: true, suspendedUntil: true },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'SUSPEND_USER',
      entityType: 'USER',
      entityId: userId,
      reason: dto.reason,
      payload: { durationDays, suspendedUntil, targetEmail: target.email },
    });

    await this.notificationService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.WARNING,
      title: 'Account Suspended',
      message: `Your account has been suspended until ${suspendedUntil.toDateString()}. Reason: ${dto.reason}`,
      sendEmail: true,
    });

    this.logger.log(`User ${userId} suspended for ${durationDays} days by admin ${currentUser.id}`);

    return updated;
  }

  /**
   * ADM-003: Send a formal warning to a user (increments warnCount)
   */
  async warnUser(currentUser: CurrentUserPayload, userId: string, dto: WarnUserDto) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can warn users');
    }

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertModerationTarget(currentUser, target);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { warnCount: { increment: 1 }, warnedAt: new Date() },
      select: { id: true, email: true, name: true, warnCount: true, warnedAt: true },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'WARN_USER',
      entityType: 'USER',
      entityId: userId,
      reason: dto.message,
      payload: { message: dto.message, warnCount: updated.warnCount, targetEmail: target.email },
    });

    await this.notificationService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.WARNING,
      title: 'Warning from Ìlú Àṣẹ',
      message: dto.message,
      sendEmail: true,
    });

    this.logger.log(
      `User ${userId} warned by admin ${currentUser.id} (warnCount now ${updated.warnCount})`
    );

    return updated;
  }

  /**
   * ADM-003: Ban a user permanently (until manually unbanned)
   */
  async banUser(currentUser: CurrentUserPayload, userId: string, dto: BanUserDto) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can ban users');
    }

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    this.assertModerationTarget(currentUser, target);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date(), banReason: dto.reason },
      select: { id: true, email: true, name: true, bannedAt: true, banReason: true },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'BAN_USER',
      entityType: 'USER',
      entityId: userId,
      reason: dto.reason,
      payload: { targetEmail: target.email },
    });

    await this.notificationService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.URGENT,
      title: 'Account Banned',
      message: `Your account has been banned. Reason: ${dto.reason}`,
      sendEmail: true,
    });

    this.logger.log(`User ${userId} banned by admin ${currentUser.id}`);

    return updated;
  }

  /**
   * ADM-003: Lift a ban or an active suspension. The frontend routes both
   * "unsuspend" and "unban" actions through this single endpoint, so it
   * clears whichever punitive state is actually set.
   */
  async unbanUser(currentUser: CurrentUserPayload, userId: string, dto: UnbanUserDto) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can lift a suspension or ban');
    }

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const wasBanned = !!target.bannedAt;
    const wasSuspended = !!target.suspendedUntil && target.suspendedUntil > new Date();

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: null, banReason: null, suspendedUntil: null },
      select: { id: true, email: true, name: true },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'UNBAN_USER',
      entityType: 'USER',
      entityId: userId,
      reason: dto.reason,
      payload: { targetEmail: target.email, wasBanned, wasSuspended },
    });

    await this.notificationService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.SUCCESS,
      title: wasBanned ? 'Account Reinstated' : 'Suspension Lifted',
      message: wasBanned
        ? 'Your account ban has been lifted. Welcome back to Ìlú Àṣẹ.'
        : 'Your account suspension has been lifted early.',
      sendEmail: true,
    });

    this.logger.log(`User ${userId} unbanned/unsuspended by admin ${currentUser.id}`);

    return updated;
  }

  /**
   * ADM-002: Change a user's role. Granting or revoking ADMIN requires SUPER
   * (same bar as manage-admins/removeAdminPrivileges below) -- moving between
   * CLIENT/BABALAWO/VENDOR is a lower-stakes action any admin can perform.
   */
  async changeUserRole(currentUser: CurrentUserPayload, userId: string, dto: ChangeUserRoleDto) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change user roles');
    }
    if (currentUser.id === userId) {
      throw new BadRequestException('You cannot change your own role');
    }

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const grantingOrRevokingAdmin = target.role === 'ADMIN' || dto.role === 'ADMIN';
    if (grantingOrRevokingAdmin && currentUser.adminSubRole !== 'SUPER') {
      throw new ForbiddenException('Only super admins can grant or revoke admin privileges');
    }
    if (dto.role === 'ADMIN' && !dto.adminSubRole) {
      throw new BadRequestException('adminSubRole is required when promoting a user to ADMIN');
    }

    const previousRole = target.role;
    const previousAdminSubRole = target.adminSubRole;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role,
        adminSubRole: dto.role === 'ADMIN' ? dto.adminSubRole : null,
      },
      select: { id: true, email: true, name: true, role: true, adminSubRole: true },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'CHANGE_USER_ROLE',
      entityType: 'USER',
      entityId: userId,
      reason: dto.reason,
      payload: {
        targetEmail: target.email,
        previousRole,
        previousAdminSubRole,
        newRole: updated.role,
        newAdminSubRole: updated.adminSubRole,
      },
    });

    await this.notificationService.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      category: NotificationCategory.INFO,
      title: 'Account Role Updated',
      message: `Your account role has been changed to ${dto.role}.`,
      sendEmail: true,
    });

    this.logger.log(
      `User ${userId} role changed from ${previousRole} to ${dto.role} by admin ${currentUser.id}`
    );

    return updated;
  }
}
