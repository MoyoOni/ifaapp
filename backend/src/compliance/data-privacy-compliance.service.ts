import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class DataPrivacyComplianceService {
  private readonly logger = new Logger(DataPrivacyComplianceService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  /**
   * Implements the right to erasure (right to be forgotten)
   * Anonymizes user data while preserving business metrics
   */
  async rightToErasure(userId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Initiating right to erasure for user ${userId}`);
    
    // Find the user first
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Start a transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      // Anonymize user profile (keep for statistical purposes but remove PII)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${Date.now()}@example.com`, // Replace with generic email
          firstName: '[DELETED]',
          lastName: '[DELETED]',
          bio: null,
          avatar: null,
          phone: null,
          isEmailVerified: false,
          // Keep account deactivated but not deleted for metrics
          isActive: false,
          // Remove any other PII
          additionalInfo: null,
        },
      });

      // Handle related entities - anonymize or disassociate as appropriate
      // For appointments, we might want to keep the record but anonymize
      await tx.appointment.updateMany({
        where: { OR: [{ clientId: userId }, { babalawoId: userId }] },
        data: {
          notes: user.role === 'BABALAWO' ? '[Babalawo data removed]' : '[Client data removed]',
          // Depending on business requirements, you might want to anonymize vs. remove
        },
      });

      // For financial records, anonymize sensitive details
      await tx.wallet.updateMany({
        where: { userId },
        data: {
          balance: 0,
          currency: 'ANONYMIZED',
        },
      });

      // For reviews, we might keep the rating but anonymize content
      await tx.review.updateMany({
        where: { reviewerId: userId },
        data: {
          content: '[Content removed]',
          title: '[Title removed]',
        },
      });

      // For forum posts, anonymize authorship while keeping content for community value
      await tx.forumThread.updateMany({
        where: { authorId: userId },
        data: {
          authorId: null, // Remove author reference
          content: this.anonymizeContent(user.role, 'thread'),
        },
      });

      await tx.forumPost.updateMany({
        where: { authorId: userId },
        data: {
          authorId: null, // Remove author reference
          content: this.anonymizeContent(user.role, 'post'),
        },
      });

      // Remove authentication data
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // Handle other related data as needed based on your schema
    });

    this.logger.log(`Right to erasure completed for user ${userId}`);
    return {
      success: true,
      message: 'User data has been anonymized in accordance with right to erasure',
    };
  }

  /**
   * Implements the right to data portability
   * Exports user data in a commonly used format
   */
  async rightToDataPortability(userId: string): Promise<any> {
    this.logger.log(`Initiating right to data portability for user ${userId}`);

    // Fetch user with related data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        appointmentsAsClient: true,
        appointmentsAsBabalawo: true,
        wallet: true,
        reviewsReceived: true,
        reviewsGiven: true,
        forumThreads: true,
        forumPosts: true,
        // Include other related data as needed
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Format the data according to GDPR requirements
    const userDataExport = {
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
      },
      appointments: {
        asClient: user.appointmentsAsClient.map(appointment => ({
          id: appointment.id,
          scheduledStart: appointment.scheduledStart,
          scheduledEnd: appointment.scheduledEnd,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
        })),
        asBabalawo: user.appointmentsAsBabalawo.map(appointment => ({
          id: appointment.id,
          scheduledStart: appointment.scheduledStart,
          scheduledEnd: appointment.scheduledEnd,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
        })),
      },
      wallet: user.wallet ? {
        id: user.wallet.id,
        userId: user.wallet.userId,
        balance: user.wallet.balance,
        currency: user.wallet.currency,
        createdAt: user.wallet.createdAt,
        updatedAt: user.wallet.updatedAt,
      } : null,
      reviews: {
        received: user.reviewsReceived.map(review => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          createdAt: review.createdAt,
        })),
        given: user.reviewsGiven.map(review => ({
          id: review.id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          createdAt: review.createdAt,
        })),
      },
      forumActivity: {
        threads: user.forumThreads.map(thread => ({
          id: thread.id,
          title: thread.title,
          content: thread.content,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          isLocked: thread.isLocked,
          isPinned: thread.isPinned,
          status: thread.status,
        })),
        posts: user.forumPosts.map(post => ({
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })),
      },
      // Add other relevant data sections
    };

    this.logger.log(`Data portability export completed for user ${userId}`);
    return userDataExport;
  }

  /**
   * Implements consent management
   */
  async manageUserConsent(userId: string, consentType: string, granted: boolean): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Managing consent for user ${userId}, type: ${consentType}, granted: ${granted}`);

    // In a real implementation, you would store consent preferences
    // For now, we'll simulate this functionality
    const validConsentTypes = [
      'marketing_emails',
      'usage_analytics',
      'research_data',
      'location_tracking',
      'personalized_content'
    ];

    if (!validConsentTypes.includes(consentType)) {
      throw new BadRequestException(`Invalid consent type: ${consentType}. Valid types: ${validConsentTypes.join(', ')}`);
    }

    // In a real implementation, you would update a consent management table
    // Here we'll just log the action
    await this.prisma.consentLog.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType
        }
      },
      update: {
        granted,
        updatedAt: new Date()
      },
      create: {
        userId,
        consentType,
        granted
      }
    });

    this.logger.log(`Consent managed for user ${userId}, type: ${consentType}, granted: ${granted}`);
    return {
      success: true,
      message: `Consent for ${consentType} ${granted ? 'granted' : 'revoked'} successfully`
    };
  }

  /**
   * Checks if user has consented to a specific type
   */
  async checkUserConsent(userId: string, consentType: string): Promise<boolean> {
    this.logger.log(`Checking consent for user ${userId}, type: ${consentType}`);

    const consentRecord = await this.prisma.consentLog.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType
        }
      }
    });

    // Return true if consent exists and is granted, otherwise false
    return consentRecord ? consentRecord.granted : false;
  }

  /**
   * Generates a privacy compliance report
   */
  async generatePrivacyComplianceReport(): Promise<any> {
    this.logger.log('Generating privacy compliance report');

    // Count total users
    const totalUsers = await this.prisma.user.count();

    // Count active users
    const activeUsers = await this.prisma.user.count({
      where: { isActive: true }
    });

    // Count users who have granted specific consents
    const marketingConsentCount = await this.prisma.consentLog.count({
      where: {
        consentType: 'marketing_emails',
        granted: true
      }
    });

    // Count recent erasure requests (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentErasureRequests = await this.prisma.user.count({
      where: {
        isActive: false,
        updatedAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersWithMarketingConsent: marketingConsentCount,
        recentErasureRequests,
      },
      complianceStatus: {
        rightToErasureImplemented: true,
        rightToDataPortabilityImplemented: true,
        consentManagementImplemented: true,
        dataExportCapability: true,
        automatedErasureProcess: true,
      },
      recommendations: [
        'Regularly audit consent records to ensure freshness',
        'Implement automated deletion of truly temporary data',
        'Provide users with a dashboard to manage all their privacy settings',
        'Document all data processing activities as required by GDPR Article 30'
      ]
    };

    this.logger.log('Privacy compliance report generated');
    return report;
  }

  /**
   * Helper to anonymize content based on user role and content type
   */
  private anonymizeContent(role: string, contentType: 'thread' | 'post'): string {
    if (role === 'BABALAWO') {
      return `[Babalawo ${contentType} content anonymized]`;
    }
    return `[User ${contentType} content anonymized]`;
  }
}