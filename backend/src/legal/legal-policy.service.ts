import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

export enum PolicyType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  COMMUNITY_GUIDELINES = 'COMMUNITY_GUIDELINES',
  COOKIE_POLICY = 'COOKIE_POLICY',
  REFUND_POLICY = 'REFUND_POLICY',
}

export interface PolicyVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  isCurrent: boolean;
  createdAt: Date;
}

@Injectable()
export class LegalPolicyService {
  private readonly logger = new Logger(LegalPolicyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new version of a legal policy
   * @param policyType The type of policy being created
   * @param title The title of the policy
   * @param content The full text content of the policy
   * @param effectiveDate When the policy becomes effective
   * @param admin Admin creating the policy for audit trail
   */
  async createPolicyVersion(
    policyType: PolicyType,
    title: string,
    content: string,
    effectiveDate: Date,
    admin: CurrentUserPayload
  ): Promise<PolicyVersion> {
    try {
      // First, mark any existing current version as non-current
      await this.prisma.policyVersion.updateMany({
        where: {
          policyType,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      // Calculate the next version number
      const latestVersion = await this.prisma.policyVersion.findFirst({
        where: { policyType },
        orderBy: { version: 'desc' },
      });

      let nextVersion = '1.0';
      if (latestVersion) {
        const versionParts = latestVersion.version.split('.').map(Number);
        nextVersion = `${versionParts[0]}.${versionParts[1] + 1}`;
      }

      // Create the new policy version
      const policyVersion = await this.prisma.policyVersion.create({
        data: {
          policyType,
          version: nextVersion,
          title,
          content,
          effectiveDate,
          isCurrent: true,
          createdBy: admin.id,
        },
      });

      this.logger.log(`Created new policy version ${nextVersion} for ${policyType}`);

      return policyVersion;
    } catch (error) {
      this.logger.error(
        `Error creating policy version for ${policyType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not create policy version: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves the current version of a policy
   * @param policyType The type of policy to retrieve
   */
  async getCurrentPolicy(policyType: PolicyType): Promise<PolicyVersion | null> {
    try {
      const policy = await this.prisma.policyVersion.findFirst({
        where: {
          policyType,
          isCurrent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return policy;
    } catch (error) {
      this.logger.error(
        `Error retrieving current policy for ${policyType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not retrieve policy: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves all versions of a policy
   * @param policyType The type of policy to retrieve
   */
  async getAllPolicyVersions(policyType: PolicyType): Promise<PolicyVersion[]> {
    try {
      const policies = await this.prisma.policyVersion.findMany({
        where: {
          policyType,
        },
        orderBy: {
          version: 'desc',
        },
      });

      return policies;
    } catch (error) {
      this.logger.error(
        `Error retrieving all policy versions for ${policyType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not retrieve policy versions: ${(error as Error).message}`);
    }
  }

  /**
   * Gets user's acceptance record for a specific policy
   * @param userId The ID of the user
   * @param policyType The type of policy
   */
  async getUserPolicyAcceptance(userId: string, policyType: PolicyType) {
    try {
      // Get the current version of the policy
      const currentPolicy = await this.getCurrentPolicy(policyType);
      if (!currentPolicy) {
        return { accepted: false, policyVersion: null };
      }

      // Check if the user has accepted this version
      const acceptance = await this.prisma.policyAcceptance.findFirst({
        where: {
          userId,
          policyVersionId: currentPolicy.id,
        },
      });

      return {
        accepted: !!acceptance,
        policyVersion: currentPolicy,
        acceptedAt: acceptance?.acceptedAt || null,
        requiresAcceptance: !acceptance,
      };
    } catch (error) {
      this.logger.error(
        `Error retrieving user policy acceptance for user ${userId}, policy ${policyType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not retrieve policy acceptance: ${(error as Error).message}`);
    }
  }

  /**
   * Records user acceptance of a policy
   * @param userId The ID of the user accepting
   * @param policyType The type of policy being accepted
   * @param accepted Whether the policy was accepted or rejected
   */
  async acceptPolicy(userId: string, policyType: PolicyType, accepted: boolean) {
    try {
      if (!accepted) {
        throw new BadRequestException('Cannot reject required policies');
      }

      // Get the current version of the policy
      const currentPolicy = await this.getCurrentPolicy(policyType);
      if (!currentPolicy) {
        throw new BadRequestException(`Policy ${policyType} not found`);
      }

      // Record the acceptance
      const acceptance = await this.prisma.policyAcceptance.upsert({
        where: {
          userId_policyVersionId: {
            userId,
            policyVersionId: currentPolicy.id,
          },
        },
        update: {
          acceptedAt: new Date(),
          ipAddress: null, // This would normally come from request
        },
        create: {
          userId,
          policyVersionId: currentPolicy.id,
          acceptedAt: new Date(),
          ipAddress: null, // This would normally come from request
        },
      });

      this.logger.log(`User ${userId} accepted policy ${policyType} version ${currentPolicy.version}`);

      return {
        accepted: true,
        policyVersion: currentPolicy.version,
        acceptedAt: acceptance.acceptedAt,
      };
    } catch (error) {
      this.logger.error(
        `Error recording policy acceptance for user ${userId}, policy ${policyType} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not record policy acceptance: ${(error as Error).message}`);
    }
  }

  /**
   * Gets all policy acceptances for a user
   * @param userId The ID of the user
   */
  async getUserPolicyAcceptances(userId: string) {
    try {
      const acceptances = await this.prisma.policyAcceptance.findMany({
        where: {
          userId,
        },
        include: {
          policyVersion: true,
        },
        orderBy: {
          acceptedAt: 'desc',
        },
      });

      return acceptances;
    } catch (error) {
      this.logger.error(
        `Error retrieving policy acceptances for user ${userId} - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not retrieve policy acceptances: ${(error as Error).message}`);
    }
  }

  /**
   * Gets compliance summary for admin reporting
   */
  async getComplianceSummary() {
    try {
      // Count total policies
      const totalPolicies = await this.prisma.policyVersion.groupBy({
        by: ['policyType'],
        _count: true,
        where: { isCurrent: true },
      });

      // Count policy acceptances
      const acceptanceCounts = await this.prisma.policyAcceptance.groupBy({
        by: ['policyVersionId'],
        _count: true,
      });

      // Get total user count
      const totalUsers = await this.prisma.user.count();

      // Count users who have accepted each policy type
      const userAcceptanceByPolicy = await this.prisma.policyAcceptance.groupBy({
        by: ['policyVersionId'],
        _count: true,
        where: {
          policyVersion: {
            isCurrent: true,
          },
        },
      });

      return {
        totalPolicies: totalPolicies.reduce((acc, curr) => ({...acc, [curr.policyType]: curr._count}), {}),
        totalUsers,
        acceptanceCounts,
        userAcceptanceByPolicy,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error generating compliance summary - ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new BadRequestException(`Could not generate compliance summary: ${(error as Error).message}`);
    }
  }
}