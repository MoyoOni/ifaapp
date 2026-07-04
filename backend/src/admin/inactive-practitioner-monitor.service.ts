import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class InactivePractitionerMonitorService implements OnModuleInit {
  private readonly logger = new Logger(InactivePractitionerMonitorService.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async onModuleInit() {
    // Initialize the service but don't start monitoring automatically
    this.logger.log('Inactive Practitioner Monitor Service initialized');
  }

  /**
   * Cron job that runs daily to identify and potentially notify about inactive practitioners
   * This runs at 2:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyInactiveMonitoring() {
    this.logger.log('Starting daily inactive practitioner monitoring');

    try {
      // Check for practitioners who haven't logged in for 14+ days
      const inactivePractitioners = await this.adminService.getInactivePractitioners(
        { role: 'ADMIN', id: 'SYSTEM_MONITOR' } as any, // Mock admin user for system operations
        14
      );

      // Filter to only include practitioners who are currently active (not on leave or deactivated)
      const trulyInactivePractitioners = inactivePractitioners.filter(
        (p) => !p.isOnLeave && !p.isDeactivated
      );

      this.logger.log(`Found ${trulyInactivePractitioners.length} inactive practitioners`);

      // Optionally, send notifications to the admin team about these practitioners
      if (trulyInactivePractitioners.length > 0) {
        // In a real implementation, we would notify admins about these practitioners
        // For now, we'll just log the findings
        trulyInactivePractitioners.forEach((practitioner) => {
          this.logger.log(
            `Inactive practitioner: ${practitioner.name} (${practitioner.email}), ` +
              `on leave: ${practitioner.isOnLeave}`
          );
        });
      }

      this.logger.log('Completed daily inactive practitioner monitoring');
    } catch (error) {
      this.logger.error('Error during inactive practitioner monitoring:', error);
    }
  }

  /**
   * Get statistics about inactive practitioners
   */
  async getInactivePractitionerStats() {
    // Get practitioners who haven't logged in for 14+ days
    const inactiveFor14Days = await this.adminService.getInactivePractitioners(
      { role: 'ADMIN', id: 'SYSTEM_MONITOR' } as any,
      14
    );

    // Get practitioners who haven't logged in for 30+ days
    const inactiveFor30Days = await this.adminService.getInactivePractitioners(
      { role: 'ADMIN', id: 'SYSTEM_MONITOR' } as any,
      30
    );

    // Get practitioners who haven't accepted a booking in 30+ days
    // This requires a separate method that checks appointments
    const practitionersWithoutRecentBookings = await this.getPractitionersWithoutRecentBookings();

    return {
      totalInactive14Days: inactiveFor14Days.length,
      totalInactive30Days: inactiveFor30Days.length,
      totalWithoutRecentBookings: practitionersWithoutRecentBookings.length,
      totalOnLeave: await this.prisma.user.count({
        where: {
          role: 'BABALAWO',
          isOnLeave: true,
        },
      }),
      totalDeactivated: await this.prisma.user.count({
        where: {
          role: 'BABALAWO',
          isDeactivated: true,
        },
      }),
    };
  }

  /**
   * Get practitioners who haven't accepted a booking in the specified number of days
   */
  private async getPractitionersWithoutRecentBookings(daysThreshold: number = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysThreshold);

    // Get all practitioners
    const allPractitioners = await this.prisma.user.findMany({
      where: {
        role: 'BABALAWO',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Filter to only those who haven't had a completed/confirmed appointment in the threshold period
    const filteredPractitioners = [];

    for (const practitioner of allPractitioners) {
      const recentAppointment = await this.prisma.appointment.findFirst({
        where: {
          babalawoId: practitioner.id,
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          createdAt: { gte: dateThreshold },
        },
      });

      // If no recent appointment was found, this practitioner qualifies
      if (!recentAppointment) {
        filteredPractitioners.push(practitioner);
      }
    }

    return filteredPractitioners;
  }

  /**
   * Get practitioners who haven't logged in for specified days AND haven't accepted a booking in 30 days
   */
  async getHighRiskInactivePractitioners(
    loginThresholdDays: number = 14,
    bookingThresholdDays: number = 30
  ) {
    // Get practitioners who haven't logged in for the specified days
    const inactiveByLogin = await this.adminService.getInactivePractitioners(
      { role: 'ADMIN', id: 'SYSTEM_MONITOR' } as any,
      loginThresholdDays
    );

    // Then check which of these also haven't accepted bookings recently
    const highRiskPractitioners = [];

    for (const practitioner of inactiveByLogin) {
      // Check if they have any confirmed/completed appointments in the last bookingThresholdDays
      const bookingThresholdDate = new Date();
      bookingThresholdDate.setDate(bookingThresholdDate.getDate() - bookingThresholdDays);

      const recentAppointment = await this.prisma.appointment.findFirst({
        where: {
          babalawoId: practitioner.id,
          status: { in: ['COMPLETED', 'CONFIRMED'] },
          createdAt: { gte: bookingThresholdDate },
        },
      });

      // If they haven't accepted a booking recently, they're high risk
      if (!recentAppointment) {
        highRiskPractitioners.push(practitioner);
      }
    }

    return highRiskPractitioners;
  }
}
