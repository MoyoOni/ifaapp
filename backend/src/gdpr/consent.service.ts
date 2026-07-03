import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

export enum ConsentType {
  MARKETING_EMAILS = 'marketing_emails',
  DATA_PROCESSING = 'data_processing',
  FORUM_DIGEST = 'forum_digest',
  SPIRITUAL_DATA_SHARING = 'spiritual_data_sharing',
  APPOINTMENT_REMINDERS = 'appointment_reminders',
  LOCATION_SHARING = 'location_sharing',
  CULTURAL_RESEARCH = 'cultural_research',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
  REVOKED_BY_SYSTEM = 'REVOKED_BY_SYSTEM',
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Records or updates user consent for a specific type
   * @param userId The ID of the user providing consent
   * @param consentType The type of consent being provided
   * @param granted Whether consent is granted or withdrawn
   * @param source Where the consent was given (web, mobile, etc.)
   * @returns The consent record
   */
  async updateConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    source: string = 'web',
  ) {
    try {
      // Create or update consent record
      const consent = await this.prisma.userConsent.upsert({
        where: {
          userId_consentType: {
            userId,
            consentType,
          },
        },
        update: {
          status: granted ? ConsentStatus.GRANTED : ConsentStatus.WITHDRAWN,
          updatedAt: new Date(),
          revokedAt: granted ? null : new Date(),
        },
        create: {
          userId,
          consentType,
          status: granted ? ConsentStatus.GRANTED : ConsentStatus.WITHDRAWN,
          grantedAt: granted ? new Date() : null,
          revokedAt: granted ? null : new Date(),
          source,
        },
      });

      this.logger.log(
        `Consent ${granted ? 'granted' : 'withdrawn'} for user ${userId}, type: ${consentType}`
      );

      return consent;
    } catch (error) {
      this.logger.error(
        `Error updating consent for user ${userId}, type: ${consentType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not update consent: ${(error as Error).message}`);
    }
  }

  /**
   * Checks if a user has granted consent for a specific type
   * @param userId The ID of the user
   * @param consentType The type of consent to check
   * @returns Boolean indicating if consent is granted
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const consent = await this.prisma.userConsent.findUnique({
        where: {
          userId_consentType: {
            userId,
            consentType,
          },
        },
      });

      return consent?.status === ConsentStatus.GRANTED;
    } catch (error) {
      this.logger.error(
        `Error checking consent for user ${userId}, type: ${consentType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  /**
   * Gets all consents for a specific user
   * @param userId The ID of the user
   * @returns Array of consent records
   */
  async getUserConsents(userId: string) {
    try {
      const consents = await this.prisma.userConsent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return consents;
    } catch (error) {
      this.logger.error(
        `Error retrieving consents for user ${userId} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not retrieve consents: ${(error as Error).message}`);
    }
  }

  /**
   * Revokes all consents for a user (typically during account deletion)
   * @param userId The ID of the user
   * @param admin Admin performing the action for audit trail
   */
  async revokeAllConsents(userId: string, admin: CurrentUserPayload) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update all existing consents to revoked status
        const updated = await tx.userConsent.updateMany({
          where: { userId, status: ConsentStatus.GRANTED },
          data: {
            status: ConsentStatus.WITHDRAWN,
            revokedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Log this action for audit purposes
        await tx.auditLog.create({
          data: {
            userId: admin.sub,
            action: 'ALL_USER_CONSENTS_REVOKED',
            resourceType: 'UserConsent',
            resourceId: userId,
            newValues: {
              revokedBy: admin.sub,
              count: updated.count,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { count: updated.count };
      });

      this.logger.log(`All consents revoked for user ${userId}, action by admin: ${admin.sub}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error revoking consents for user ${userId} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not revoke consents: ${(error as Error).message}`);
    }
  }

  /**
   * Gets consent summary for admin compliance reporting
   */
  async getConsentSummary() {
    try {
      const counts = await this.prisma.userConsent.groupBy({
        by: ['consentType', 'status'],
        _count: true,
      });

      const summary = {
        totalRecords: 0,
        byType: {} as Record<string, Record<string, number>>,
        byStatus: {} as Record<string, number>,
      };

      counts.forEach((group) => {
        summary.totalRecords += group._count;
        
        if (!summary.byType[group.consentType]) {
          summary.byType[group.consentType] = {};
        }
        summary.byType[group.consentType][group.status] = group._count;
        
        summary.byStatus[group.status] = (summary.byStatus[group.status] || 0) + group._count;
      });

      return summary;
    } catch (error) {
      this.logger.error(
        `Error generating consent summary - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not generate consent summary: ${(error as Error).message}`);
    }
  }

  /**
   * Expires consents based on configured expiration periods
   * This method should be called periodically via a scheduled job
   */
  async expireConsents() {
    try {
      // In a real implementation, we would have configured expiration periods
      // For now, we'll just log that this method exists
      this.logger.log('Checking for expiring consents...');
      
      // Example: Update consents older than 2 years to expired status
      // This is a simplified example - actual implementation would depend on business requirements
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const expiredResult = await this.prisma.userConsent.updateMany({
        where: {
          status: ConsentStatus.GRANTED,
          createdAt: { lt: twoYearsAgo },
          // Add specific consent types that expire after 2 years if needed
        },
        data: {
          status: ConsentStatus.EXPIRED,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Expired ${expiredResult.count} consent records`);
      return { expiredCount: expiredResult.count };
    } catch (error) {
      this.logger.error(
        `Error expiring consents - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not expire consents: ${(error as Error).message}`);
    }
  }
}