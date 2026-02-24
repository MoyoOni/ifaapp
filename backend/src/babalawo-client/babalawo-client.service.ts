import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBabalawoClientDto } from './dto/create-babalawo-client.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class BabalawoClientService {
  constructor(private prisma: PrismaService) {}

  /**
   * Request Personal Awo relationship (Client initiates)
   * NOTE: Enforces exclusivity - only one active Personal Awo at a time
   */
  async requestPersonalAwo(
    clientId: string,
    babalawoId: string,
    dto: CreateBabalawoClientDto,
    currentUser: CurrentUserPayload
  ) {
    // Only client can request Personal Awo
    if (currentUser.id !== clientId || currentUser.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can request Personal Awo relationship');
    }

    // Validate Personal Awo requirements
    if (dto.relationshipType !== 'PERSONAL_AWO') {
      throw new BadRequestException('This method is for Personal Awo relationships only');
    }

    if (!dto.durationMonths || ![3, 6, 12].includes(dto.durationMonths)) {
      throw new BadRequestException('Duration must be 3, 6, or 12 months');
    }

    if (!dto.covenantAgreed || !dto.exclusivityAcknowledged) {
      throw new BadRequestException(
        'Covenant agreement and exclusivity acknowledgment are required'
      );
    }

    // EXCLUSIVITY ENFORCEMENT: Check if client already has an active Personal Awo
    const activePersonalAwo = await this.prisma.babalawoClient.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
        relationshipType: 'PERSONAL_AWO',
      },
    });

    if (activePersonalAwo) {
      // Check if in grace period (14 days before expiration)
      const now = new Date();
      if (
        activePersonalAwo.inGracePeriod &&
        activePersonalAwo.gracePeriodEnd &&
        now < activePersonalAwo.gracePeriodEnd
      ) {
        throw new BadRequestException(
          `You are in a grace period with your current Personal Awo. The grace period ends on ${activePersonalAwo.gracePeriodEnd.toLocaleDateString()}. Please reflect before making a change.`
        );
      }

      // If not in grace period, mark old relationship as CHANGED
      await this.prisma.babalawoClient.update({
        where: { id: activePersonalAwo.id },
        data: {
          status: 'CHANGED',
          changedAt: new Date(),
        },
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + dto.durationMonths);

    // Grace period starts 14 days before endDate
    const gracePeriodStart = new Date(endDate);
    gracePeriodStart.setDate(gracePeriodStart.getDate() - 14);

    // Create new Personal Awo relationship
    const relationship = await this.prisma.babalawoClient.create({
      data: {
        babalawoId,
        clientId,
        status: 'ACTIVE',
        relationshipType: 'PERSONAL_AWO',
        durationMonths: dto.durationMonths,
        startDate,
        endDate,
        covenantAgreed: dto.covenantAgreed,
        covenantText: dto.covenantText,
        exclusivityAcknowledged: dto.exclusivityAcknowledged,
        gracePeriodStart,
        gracePeriodEnd: endDate,
        inGracePeriod: false, // Will be updated by scheduled job
        notes: dto.notes,
      },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
            avatar: true,
            culturalLevel: true,
            verified: true,
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Assign a client to a Babalawo (Babalawo assigns - for one-off consultations)
   * NOTE: Client can change, but not "unfriend" - culturally respectful
   */
  async assignClient(
    babalawoId: string,
    dto: CreateBabalawoClientDto,
    currentUser: CurrentUserPayload
  ) {
    // Only the Babalawo can assign clients (for one-off consultations)
    if (currentUser.id !== babalawoId || currentUser.role !== 'BABALAWO') {
      throw new ForbiddenException('Only Babalawos can assign clients');
    }

    // Check if relationship already exists
    const existing = await this.prisma.babalawoClient.findUnique({
      where: {
        babalawoId_clientId: {
          babalawoId,
          clientId: dto.clientId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Client relationship already exists');
    }

    // Create one-off relationship
    const relationship = await this.prisma.babalawoClient.create({
      data: {
        babalawoId,
        clientId: dto.clientId,
        status: 'ACTIVE',
        relationshipType: dto.relationshipType || 'ONE_OFF',
        notes: dto.notes,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
            avatar: true,
            culturalLevel: true,
          },
        },
      },
    });

    return relationship;
  }

  /**
   * Get all clients for a Babalawo
   */
  async getClients(babalawoId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== babalawoId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own clients');
    }

    const clients = await this.prisma.babalawoClient.findMany({
      where: {
        babalawoId,
        status: 'ACTIVE',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
            avatar: true,
            culturalLevel: true,
            bio: true,
            location: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return clients;
  }

  /**
   * Get the current "Personal Awo" for a client
   */
  async getPersonalAwo(clientId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== clientId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own personal Awo');
    }

    const relationship = await this.prisma.babalawoClient.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
      },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            email: true,
            yorubaName: true,
            avatar: true,
            bio: true,
            verified: true,
            culturalLevel: true,
          },
        },
      },
    });

    if (!relationship) {
      return null;
    }

    return relationship;
  }

  /**
   * Change client's relationship (client selects different Awo)
   * NOTE: This marks the old relationship as CHANGED, not deleted
   */
  async changeClientRelationship(
    clientId: string,
    newBabalawoId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== clientId) {
      throw new ForbiddenException('You can only change your own relationship');
    }

    // Get current active relationship
    const currentRelationship = await this.prisma.babalawoClient.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
      },
    });

    // Mark current as CHANGED if exists
    if (currentRelationship) {
      await this.prisma.babalawoClient.update({
        where: { id: currentRelationship.id },
        data: {
          status: 'CHANGED',
          changedAt: new Date(),
        },
      });
    }

    // Create new relationship
    const newRelationship = await this.prisma.babalawoClient.create({
      data: {
        babalawoId: newBabalawoId,
        clientId,
        status: 'ACTIVE',
      },
      include: {
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    return newRelationship;
  }

  /**
   * Check if client can switch Personal Awo
   * Returns true if client has no active Personal Awo or is in grace period
   */
  async canSwitchPersonalAwo(clientId: string, currentUser: CurrentUserPayload) {
    // Only client can check
    if (currentUser.id !== clientId || currentUser.role !== 'CLIENT') {
      throw new ForbiddenException('Only clients can check switch eligibility');
    }

    const activePersonalAwo = await this.prisma.babalawoClient.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
        relationshipType: 'PERSONAL_AWO',
      },
    });

    if (!activePersonalAwo) {
      return { canSwitch: true, reason: 'No active Personal Awo relationship' };
    }

    const now = new Date();
    if (
      activePersonalAwo.inGracePeriod &&
      activePersonalAwo.gracePeriodEnd &&
      now < activePersonalAwo.gracePeriodEnd
    ) {
      return {
        canSwitch: true,
        reason: 'In grace period',
        gracePeriodEnd: activePersonalAwo.gracePeriodEnd,
      };
    }

    return {
      canSwitch: false,
      reason:
        'Active Personal Awo relationship exists. Grace period starts 14 days before expiration.',
      endDate: activePersonalAwo.endDate,
    };
  }
}
