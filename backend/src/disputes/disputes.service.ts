import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto, DisputeType, DisputeCategory } from './dto/create-dispute.dto';
import { ResolveDisputeDto, ResolutionType } from './dto/resolve-dispute.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletService } from '../wallet/wallet.service';

/**
 * Disputes Service
 * Handles dispute creation, routing, and resolution
 * Supports tiered routing: Admin for standard disputes, Cultural Advisory Board for spiritual matters
 */
@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService
  ) {}

  /**
   * Create a new dispute
   * Automatically routes based on category and type
   */
  async createDispute(dto: CreateDisputeDto, currentUser: CurrentUserPayload) {
    // Verify respondent exists
    const respondent = await this.prisma.user.findUnique({
      where: { id: dto.respondentId },
    });

    if (!respondent) {
      throw new NotFoundException('Respondent not found');
    }

    // Verify related entity exists if provided
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      // Verify user is involved in the order
      if (order.customerId !== currentUser.id && order.vendorId !== dto.respondentId) {
        throw new ForbiddenException('You are not involved in this order');
      }
    }

    if (dto.escrowId) {
      const escrow = await this.prisma.escrow.findUnique({
        where: { id: dto.escrowId },
      });
      if (!escrow) {
        throw new NotFoundException('Escrow not found');
      }
      // Verify user is involved in the escrow
      if (escrow.userId !== currentUser.id && escrow.recipientId !== dto.respondentId) {
        throw new ForbiddenException('You are not involved in this escrow');
      }
    }

    // Determine routing based on category and type
    const routing = this.determineRouting(dto.type, dto.category);

    // Determine priority
    const priority = this.determinePriority(dto.category, dto.type);

    // Create dispute
    const dispute = await this.prisma.dispute.create({
      data: {
        orderId: dto.orderId,
        escrowId: dto.escrowId,
        appointmentId: dto.appointmentId,
        complainantId: currentUser.id,
        respondentId: dto.respondentId,
        type: dto.type,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        evidence: dto.evidence || [],
        status: 'OPEN',
        priority,
        routedTo: routing,
      },
      include: {
        complainant: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
      },
    });

    // If escrow is involved, freeze it
    if (dto.escrowId) {
      await this.walletService.freezeEscrowForDispute(dto.escrowId, dispute.id);
    }

    this.logger.log(`Dispute ${dispute.id} created and routed to ${routing}`);

    return dispute;
  }

  /**
   * Determine routing based on dispute type and category
   * Spiritual matters go to Advisory Board, others to Admin
   */
  private determineRouting(type: DisputeType, category: DisputeCategory): string {
    // Spiritual disputes always go to Advisory Board
    if (type === DisputeType.SPIRITUAL || category === DisputeCategory.SPIRITUAL_MISCONDUCT) {
      return 'ADVISORY_BOARD';
    }

    // Cultural authenticity issues may need both
    if (category === DisputeCategory.CULTURAL_AUTHENTICITY) {
      return 'BOTH';
    }

    // Standard disputes go to Admin
    return 'ADMIN';
  }

  /**
   * Determine priority based on category and type
   */
  private determinePriority(category: DisputeCategory, type: DisputeType): string {
    // Spiritual misconduct is urgent
    if (category === DisputeCategory.SPIRITUAL_MISCONDUCT) {
      return 'URGENT';
    }

    // Payment issues are high priority
    if (category === DisputeCategory.PAYMENT) {
      return 'HIGH';
    }

    return 'NORMAL';
  }

  /**
   * Get all disputes (filtered by user role and involvement)
   */
  async findAllDisputes(
    currentUser: CurrentUserPayload,
    filters?: {
      status?: string;
      type?: string;
      routedTo?: string;
    }
  ) {
    const where: any = {};

    // Non-admins can only see disputes they're involved in
    if (currentUser.role !== 'ADMIN') {
      where.OR = [{ complainantId: currentUser.id }, { respondentId: currentUser.id }];
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.routedTo) {
      where.routedTo = filters.routedTo;
    }

    return this.prisma.dispute.findMany({
      where,
      include: {
        complainant: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
        escrow: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get dispute by ID
   */
  async findDisputeById(disputeId: string, currentUser: CurrentUserPayload) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        complainant: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            email: true,
          },
        },
        escrow: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Check access
    if (
      currentUser.role !== 'ADMIN' &&
      dispute.complainantId !== currentUser.id &&
      dispute.respondentId !== currentUser.id
    ) {
      throw new ForbiddenException('You do not have access to this dispute');
    }

    return dispute;
  }

  /**
   * Resolve dispute (Admin or Advisory Board)
   */
  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, currentUser: CurrentUserPayload) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { escrow: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Only admins or assigned reviewers can resolve
    if (currentUser.role !== 'ADMIN' && dispute.assignedTo !== currentUser.id) {
      throw new ForbiddenException('You are not authorized to resolve this dispute');
    }

    // Handle resolution based on type
    if (dto.resolution === ResolutionType.REFUND && dispute.escrowId) {
      if (!dispute.escrow) {
        throw new BadRequestException('Escrow details not found for dispute');
      }

      // Refund to complainant - release escrow funds back to sender
      await this.walletService.unfreezeEscrowAfterDispute(dispute.escrowId);

      // Create DTO to release the full amount back to sender (since no recipient specified, it goes back to originator)
      const releaseDto = {
        escrowId: dispute.escrowId,
        amount: dispute.escrow.amount, // Full amount for full refund from the escrow
      };

      await this.walletService.releaseEscrow(dispute.escrow.userId, releaseDto as any, currentUser);
    } else if (dto.resolution === ResolutionType.PARTIAL_REFUND && dispute.escrowId) {
      if (!dispute.escrow) {
        throw new BadRequestException('Escrow details not found for dispute');
      }

      // Partial refund logic
      if (!dto.amount) {
        throw new BadRequestException('Amount is required for partial refund');
      }

      await this.walletService.unfreezeEscrowAfterDispute(dispute.escrowId);

      // Create DTO to release only the specified amount back to sender
      const releaseDto = {
        escrowId: dispute.escrowId,
        amount: dto.amount, // Partial amount
      };

      await this.walletService.releaseEscrow(dispute.escrow.userId, releaseDto as any, currentUser);
    }

    // Update dispute
    const resolved = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: dto.resolution,
        resolutionType: dto.resolution,
        resolvedBy: currentUser.id,
        resolvedAt: new Date(),
        closedAt: new Date(),
      },
    });

    this.logger.log(`Dispute ${disputeId} resolved by ${currentUser.id}`);

    return resolved;
  }

  /**
   * Escalate dispute to Advisory Board
   */
  async escalateToAdvisoryBoard(disputeId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can escalate disputes');
    }

    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        routedTo: 'ADVISORY_BOARD',
        escalatedAt: new Date(),
        status: 'ESCALATED',
      },
    });
  }

  /**
   * Assign dispute to reviewer
   */
  async assignDispute(disputeId: string, reviewerId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can assign disputes');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        assignedTo: reviewerId,
        status: 'UNDER_REVIEW',
      },
    });
  }
}
