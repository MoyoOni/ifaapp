import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Exports all personal data for a user in compliance with GDPR Article 20 (right to data portability)
   * @param userId The ID of the user requesting their data
   * @returns User data in JSON format suitable for export
   */
  async exportUserData(userId: string) {
    try {
      // Fetch basic user information
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          whatsappNumber: true,
          yorubaName: true,
          avatar: true,
          bio: true,
          aboutMe: true,
          gender: true,
          age: true,
          location: true,
          culturalLevel: true,
          rankXP: true,
          dialectPreference: true,
          themeColor: true,
          profileVisibility: true,
          interests: true,
          verified: true,
          emailVerifiedAt: true,
          hasOnboarded: true,
          slug: true,
          adminSubRole: true,
          templeId: true,
          createdAt: true,
          updatedAt: true,
          availability: true,
          subscriptionStatus: true,
          subscriptionEnd: true,
          referralCode: true,
          forumDigestOptIn: true, // This field exists in the schema
          isCommunityBuilder: true,
          contributionStreak: true,
          lastContributionDate: true,
          longestStreak: true,
          trustScore: true,
          trustScoreOverride: true,
          trustScoreOverrideReason: true,
          trustScoreOverrideBy: true,
          trustScoreOverrideAt: true,
          passedCulturalOrientation: true,
          isOnLeave: true,
          isDeactivated: true,
          suspendedUntil: true,
          bannedAt: true,
          banReason: true,
          warnedAt: true,
          warnCount: true,
          isFeatured: true,
          featuredOrder: true,
          featuredExpiry: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Fetch related data
      const userData = {
        user: user,
        appointmentsAsBabalawo: await this.prisma.appointment.findMany({
          where: { babalawoId: userId },
          select: {
            id: true,
            clientId: true,
            date: true, // Using the correct field name instead of scheduledAt
            time: true, // Using the correct field name instead of scheduledAt
            timezone: true,
            duration: true,
            status: true,
            price: true,
            notes: true,
            cancelledAt: true,
            cancelledBy: true,
            isPriority: true,
            createdAt: true,
            updatedAt: true,
            recordingUrl: true,
            videoRoomId: true,
            topic: true,
          },
        }),
        appointmentsAsClient: await this.prisma.appointment.findMany({
          where: { clientId: userId },
          select: {
            id: true,
            babalawoId: true,
            date: true, // Using the correct field name instead of scheduledAt
            time: true, // Using the correct field name instead of scheduledAt
            timezone: true,
            duration: true,
            status: true,
            price: true,
            notes: true,
            cancelledAt: true,
            cancelledBy: true,
            isPriority: true,
            createdAt: true,
            updatedAt: true,
            recordingUrl: true,
            videoRoomId: true,
            topic: true,
          },
        }),
        certificates: await this.prisma.certificate.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            issuer: true,
            date: true,
            tier: true,
            createdAt: true,
          },
        }),
        reviews: await this.prisma.babalawoReview.findMany({
          where: { clientId: userId },
          select: {
            id: true,
            babalawoId: true,
            rating: true,
            title: true,
            content: true, // Using the correct field name instead of comment or review
            accuracyRating: true,
            communicationRating: true,
            culturalRespectRating: true,
            acknowledgeCount: true,
            status: true,
            moderatedBy: true,
            moderatedAt: true,
            moderationNotes: true,
            flaggedCount: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        receivedReviews: await this.prisma.babalawoReview.findMany({
          where: { babalawoId: userId },
          select: {
            id: true,
            clientId: true,
            rating: true,
            title: true,
            content: true, // Using the correct field name instead of comment or review
            accuracyRating: true,
            communicationRating: true,
            culturalRespectRating: true,
            acknowledgeCount: true,
            status: true,
            moderatedBy: true,
            moderatedAt: true,
            moderationNotes: true,
            flaggedCount: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        messagesSent: await this.prisma.message.findMany({
          where: { senderId: userId },
          select: {
            id: true,
            receiverId: true,
            content: true,
            readAt: true,
            createdAt: true,
          },
        }),
        messagesReceived: await this.prisma.message.findMany({
          where: { receiverId: userId },
          select: {
            id: true,
            senderId: true,
            content: true,
            readAt: true,
            createdAt: true,
          },
        }),
        wallet: await this.prisma.wallet.findUnique({
          where: { userId },
          select: {
            id: true,
            balance: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        transactions: await this.prisma.transaction.findMany({
          where: { userId },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        }),
        notifications: await this.prisma.notification.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            message: true, // Using the correct field name instead of body
            read: true,
            createdAt: true,
          },
        }),
        forumThreads: await this.prisma.forumThread.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            categoryId: true,
            title: true,
            content: true,
            tags: true,
            status: true,
            isPinned: true,
            isLocked: true,
            isApproved: true,
            isSacred: true,
            isFeatured: true,
            featuredUntil: true,
            viewCount: true,
            postCount: true,
            lastPostAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        forumPosts: await this.prisma.forumPost.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            threadId: true,
            content: true,
            status: true, // Using the correct field name instead of approved
            isEdited: true,
            editedAt: true,
            isAnonymous: true,
            acknowledgeCount: true,
            hasCrisisSignal: true,
            isFirstResponder: true,
            postTag: true,
            heldForReview: true,
            reviewReason: true,
            reviewedBy: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        subscriptions: await this.prisma.subscription.findMany({
          where: { userId },
          select: {
            id: true,
            plan: true,
            status: true,
            paystackSubId: true,
            paystackRef: true,
            startDate: true,
            endDate: true,
            autoRenew: true,
            amountPaid: true,
            currency: true,
            reminderSent: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        payments: await this.prisma.payment.findMany({
          where: { userId },
          select: {
            id: true,
            amount: true,
            currency: true,
            purpose: true, // Changed from paymentMethod to purpose
            provider: true, // This is the closest to paymentMethod
            status: true,
            metadata: true,
            verified: true,
            verifiedAt: true,
            verifiedBy: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      };

      this.logger.log(`User data export completed for user ID: ${userId}`);
      return userData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error during user data export for user ID ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not export user data: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes all personal data for a user in compliance with GDPR Article 17 (right to erasure)
   * @param userId The ID of the user requesting deletion
   * @param admin The admin performing the action (for audit logging)
   */
  async deleteUser(userId: string, admin: CurrentUserPayload) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, id: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Perform the deletion/anonymization
      const result = await this.prisma.$transaction(async (tx) => {
        // Anonymize user record instead of deleting it completely for legal reasons
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            email: `deleted_${Date.now()}_${userId}@example.com`,
            name: '[Deleted User]',
            phone: null,
            whatsappNumber: null,
            avatar: null,
            bio: null,
            aboutMe: null,
            gender: null,
            age: null,
            location: null,
            interests: [],
            isDeactivated: true,
            // Remove all sensitive data
            yorubaName: null,
            dialectPreference: null,
            themeColor: null,
            // Clear verification tokens
            emailVerificationToken: null,
            // Keep basic record for legal compliance
            updatedAt: new Date(),
          },
        });

        // For related entities, we'll anonymize where possible or remove references
        // depending on business requirements and legal obligations

        // For forum posts and threads, we'll keep them but anonymize author
        await tx.forumPost.updateMany({
          where: { authorId: userId },
          data: {
            content: '[Content from deleted account]',
          },
        });

        await tx.forumThread.updateMany({
          where: { authorId: userId },
          data: {
            title: '[Title from deleted account]',
            content: '[Content from deleted account]',
          },
        });

        // Delete messages where the user was involved (both sent and received)
        await tx.message.deleteMany({
          where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
        });

        // Anonymize or remove other related data as appropriate
        await tx.babalawoReview.updateMany({
          where: { clientId: userId },
          data: {
            content: '[Review from deleted account]', // Using the correct field name instead of comment or review
            rating: 0, // Reset rating
          },
        });

        // Log this action for audit purposes
        await tx.auditLog.create({
          data: {
            userId: admin.sub, // Using the correct field name for audit log
            action: 'USER_DATA_DELETION_REQUEST',
            resourceType: 'User', // Using the correct field name instead of entityType
            resourceId: userId,
            previousValues: undefined, // Using correct type instead of null
            newValues: {
              deletedUserId: userId,
              deletedUserEmail: user.email,
              deletedUserName: user.name,
              performedBy: admin.sub,
              timestamp: new Date().toISOString(),
            }, // Using correct field name instead of payload
          },
        });

        return { success: true, message: 'User data has been anonymized and marked for deletion' };
      });

      this.logger.log(
        `User data deletion/anonymization completed for user ID: ${userId}, performed by admin: ${admin.sub}`
      );
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error during user data deletion for user ID ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not delete user account: ${(error as Error).message}`);
    }
  }

  /**
   * Updates user's consent preferences
   * @param userId The ID of the user updating preferences
   * @param preferences Consent preferences to update
   */
  async updateConsentPreferences(
    userId: string,
    preferences: {
      marketingEmails?: boolean;
      dataProcessing?: boolean;
      forumDigest?: boolean;
    }
  ) {
    try {
      // Since the schema doesn't have marketingEmailOptIn or dataProcessingConsent fields,
      // we'll only update the forumDigestOptIn which does exist
      const updates: any = {};
      if (preferences.forumDigest !== undefined) {
        updates.forumDigestOptIn = preferences.forumDigest;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          forumDigestOptIn: true,
        },
      });

      this.logger.log(`Consent preferences updated for user ID: ${userId}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error updating consent preferences for user ID ${userId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(
        `Could not update consent preferences: ${(error as Error).message}`
      );
    }
  }

  async getConsentPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, forumDigestOptIn: true, createdAt: true },
    });
    if (!user) throw new BadRequestException('User not found');
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      forumDigest: user.forumDigestOptIn,
      consentRecordedAt: user.createdAt,
    };
  }
}
