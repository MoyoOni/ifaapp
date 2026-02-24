import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notifications/notification.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateGuidancePlanDto } from './dto/create-prescription.dto';
import { ApproveGuidancePlanDto } from './dto/approve-prescription.dto';
import { EscrowType, Currency } from '@ile-ase/common';

/**
 * Guidance Plan Service (formerly Prescription)
 * Handles Akose/Ebo guidance plans after divination sessions
 * NOTE: Guidance plans can only be created after appointment status = COMPLETED (divination required)
 * NOTE: Fixed platform service fee (₦100 or $0.50) - NOT a commission on sacred items
 */
@Injectable()
export class GuidancePlansService {
  private readonly logger = new Logger(GuidancePlansService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationService: NotificationService
  ) {}

  /**
   * Create guidance plan (Babalawo only)
   * CRITICAL: Must check that appointment is COMPLETED (divination required)
   */
  async createGuidancePlan(
    babalawoId: string,
    dto: CreateGuidancePlanDto,
    currentUser: CurrentUserPayload
  ) {
    // Only Babalawos can create guidance plans
    if (currentUser.role !== 'BABALAWO' || currentUser.id !== babalawoId) {
      throw new ForbiddenException('Only Babalawos can create guidance plans');
    }

    // Get appointment and verify it exists and is completed
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        babalawo: true,
        client: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // CRITICAL: Enforce divination completion requirement
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Guidance plan can only be created after divination session is completed. Please mark the appointment as completed first.'
      );
    }

    // Verify appointment belongs to this Babalawo
    if (appointment.babalawoId !== babalawoId) {
      throw new ForbiddenException('This appointment does not belong to you');
    }

    // Check if guidance plan already exists for this appointment
    const existing = await this.prisma.guidancePlan.findUnique({
      where: { appointmentId: dto.appointmentId },
    });

    if (existing) {
      throw new BadRequestException('Guidance plan already exists for this appointment');
    }

    // Validate total cost matches items
    const calculatedTotal = dto.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    if (Math.abs(calculatedTotal - dto.totalCost) > 0.01) {
      throw new BadRequestException('Total cost does not match sum of items');
    }

    // Calculate platform service fee (₦100 for NGN, $0.50 for USD)
    const platformServiceFee = dto.currency === Currency.USD ? 0.5 : 100;

    // Create guidance plan
    const guidancePlan = await this.prisma.guidancePlan.create({
      data: {
        appointmentId: dto.appointmentId,
        babalawoId,
        clientId: appointment.clientId,
        type: dto.type,
        items: dto.items as any,
        totalCost: dto.totalCost,
        platformServiceFee,
        currency: dto.currency || Currency.NGN,
        instructions: dto.instructions,
        notes: dto.notes,
        status: 'PENDING', // Awaiting client approval
      },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
          },
        },
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Guidance plan created: ${guidancePlan.id} for appointment ${dto.appointmentId} by Babalawo ${babalawoId}`
    );

    // Notify client that guidance plan is available for review
    await this.notificationService.notifyGuidancePlanCreated(
      appointment.clientId,
      guidancePlan.id,
      {
        type: dto.type,
        babalawoName: guidancePlan.babalawo.yorubaName || guidancePlan.babalawo.name,
        totalCost: dto.totalCost,
        currency: dto.currency,
      }
    );

    return guidancePlan;
  }

  /**
   * Approve guidance plan (Client only)
   * Creates escrow hold when approved (includes platform service fee)
   */
  async approveGuidancePlan(
    guidancePlanId: string,
    clientId: string,
    dto: ApproveGuidancePlanDto,
    currentUser: CurrentUserPayload
  ) {
    // Only client can approve their own guidance plan
    if (currentUser.id !== clientId) {
      throw new ForbiddenException('You can only approve your own guidance plans');
    }

    const guidancePlan = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
      include: {
        client: true,
        babalawo: true,
      },
    });

    if (!guidancePlan) {
      throw new NotFoundException('Guidance plan not found');
    }

    if (guidancePlan.clientId !== clientId) {
      throw new ForbiddenException('This guidance plan does not belong to you');
    }

    if (guidancePlan.status !== 'PENDING') {
      throw new BadRequestException(`Guidance plan is ${guidancePlan.status}, cannot be approved`);
    }

    if (dto.approve) {
      // Calculate total amount (items cost + platform service fee)
      const totalAmount = guidancePlan.totalCost + guidancePlan.platformServiceFee;

      // Create escrow hold for guidance plan payment (includes platform fee)
      const escrow = await this.walletService.createEscrow(
        clientId,
        {
          recipientId: guidancePlan.babalawoId,
          amount: totalAmount, // Total includes platform fee
          currency: guidancePlan.currency as Currency,
          type: EscrowType.GUIDANCE_PLAN,
          relatedId: guidancePlanId,
          notes: `Guidance plan payment: ${guidancePlan.type} (Items: ${guidancePlan.totalCost}, Platform fee: ${guidancePlan.platformServiceFee})`,
          releaseTiers: {
            tier1: 0.5, // 50% after guidance plan items prepared
            tier2: 0.5, // 50% after completion
          },
        },
        currentUser
      );

      // Update guidance plan status
      const updated = await this.prisma.guidancePlan.update({
        where: { id: guidancePlanId },
        data: {
          status: 'APPROVED',
          escrowId: escrow.id,
          approvedAt: new Date(),
          notes: guidancePlan.notes
            ? `${guidancePlan.notes}\n[Approved: ${new Date().toISOString()}]`
            : `[Approved: ${new Date().toISOString()}]`,
        },
        include: {
          escrow: {
            include: {
              wallet: {
                select: {
                  id: true,
                  currency: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Guidance plan approved: ${guidancePlanId}, escrow created: ${escrow.id}`);

      // Notify babalawo that plan was approved
      await this.notificationService.notifyGuidancePlanApproved(
        guidancePlan.babalawoId,
        guidancePlanId,
        {
          type: guidancePlan.type,
          clientName: guidancePlan.client.name,
          totalCost: guidancePlan.totalCost,
          currency: guidancePlan.currency,
        }
      );

      return updated;
    } else {
      // Reject guidance plan
      const updated = await this.prisma.guidancePlan.update({
        where: { id: guidancePlanId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: guidancePlan.notes
            ? `${guidancePlan.notes}\n[Rejected: ${dto.notes || 'No reason provided'}]`
            : `[Rejected: ${dto.notes || 'No reason provided'}]`,
        },
      });

      this.logger.log(`Guidance plan rejected: ${guidancePlanId}`);

      // Notify babalawo that plan was rejected
      await this.notificationService.notifyGuidancePlanRejected(
        guidancePlan.babalawoId,
        guidancePlanId,
        {
          type: guidancePlan.type,
          clientName: guidancePlan.client.name,
          reason: dto.notes,
        }
      );

      return updated;
    }
  }

  /**
   * Get guidance plan by ID
   */
  async getGuidancePlan(guidancePlanId: string, currentUser: CurrentUserPayload) {
    const guidancePlan = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
          },
        },
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        escrow: {
          include: {
            wallet: {
              select: {
                id: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    if (!guidancePlan) {
      throw new NotFoundException('Guidance plan not found');
    }

    // Only Babalawo, client, or admin can view
    const canView =
      guidancePlan.babalawoId === currentUser.id ||
      guidancePlan.clientId === currentUser.id ||
      currentUser.role === 'ADMIN';

    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this guidance plan');
    }

    return guidancePlan;
  }

  /**
   * Get guidance plans for user (Babalawo or Client)
   */
  async getUserGuidancePlans(
    userId: string,
    filters: {
      status?: string;
      type?: string;
    },
    currentUser?: CurrentUserPayload
  ) {
    if (!currentUser) {
      throw new ForbiddenException('Authentication required');
    }
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only view your own guidance plans');
    }

    const where: any = {
      OR: [{ babalawoId: userId }, { clientId: userId }],
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return this.prisma.guidancePlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: {
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
          },
        },
        babalawo: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        escrow: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
      },
    });
  }

  /**
   * Mark guidance plan as completed (Babalawo only)
   */
  async completeGuidancePlan(
    guidancePlanId: string,
    babalawoId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'BABALAWO' || currentUser.id !== babalawoId) {
      throw new ForbiddenException('Only Babalawos can mark guidance plans as completed');
    }

    const guidancePlan = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
    });

    if (!guidancePlan) {
      throw new NotFoundException('Guidance plan not found');
    }

    if (guidancePlan.babalawoId !== babalawoId) {
      throw new ForbiddenException('This guidance plan does not belong to you');
    }

    if (guidancePlan.status !== 'APPROVED' && guidancePlan.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Guidance plan is ${guidancePlan.status}, cannot be completed`);
    }

    const updated = await this.prisma.guidancePlan.update({
      where: { id: guidancePlanId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        escrow: true,
      },
    });

    // Release tier 2 (remaining 50%) of escrow
    if (updated.escrow) {
      await this.walletService.releaseEscrow(
        guidancePlan.clientId,
        {
          escrowId: updated.escrow.id,
          tier: 'TIER_2' as any,
          notes: 'Guidance plan completed - final tier release',
        },
        currentUser
      );
    }

    this.logger.log(`Guidance plan completed: ${guidancePlanId}`);

    // Notify client that guidance plan is complete
    const planWithDetails = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
      include: {
        babalawo: { select: { name: true, yorubaName: true } },
        client: { select: { name: true } },
      },
    });

    if (planWithDetails) {
      await this.notificationService.notifyGuidancePlanCompleted(
        guidancePlan.clientId,
        guidancePlanId,
        {
          type: guidancePlan.type,
          babalawoName: planWithDetails.babalawo.yorubaName || planWithDetails.babalawo.name,
          clientName: planWithDetails.client.name,
        }
      );
    }

    return updated;
  }

  /**
   * Mark guidance plan as in progress (Babalawo only)
   */
  async markInProgress(
    guidancePlanId: string,
    babalawoId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.role !== 'BABALAWO' || currentUser.id !== babalawoId) {
      throw new ForbiddenException('Only Babalawos can mark guidance plans as in progress');
    }

    const guidancePlan = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
    });

    if (!guidancePlan) {
      throw new NotFoundException('Guidance plan not found');
    }

    if (guidancePlan.babalawoId !== babalawoId) {
      throw new ForbiddenException('This guidance plan does not belong to you');
    }

    if (guidancePlan.status !== 'APPROVED') {
      throw new BadRequestException(
        `Guidance plan is ${guidancePlan.status}, cannot mark as in progress`
      );
    }

    const updated = await this.prisma.guidancePlan.update({
      where: { id: guidancePlanId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        escrow: true,
      },
    });

    // Release tier 1 (50%) of escrow when work starts
    if (updated.escrow) {
      await this.walletService.releaseEscrow(
        guidancePlan.clientId,
        {
          escrowId: updated.escrow.id,
          tier: 'TIER_1' as any,
          notes: 'Guidance plan work started - first tier release',
        },
        currentUser
      );
    }

    this.logger.log(`Guidance plan marked in progress: ${guidancePlanId}`);

    // Notify client that work has started
    const planWithDetails = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
      include: {
        babalawo: { select: { name: true, yorubaName: true } },
        client: { select: { name: true } },
      },
    });

    if (planWithDetails) {
      await this.notificationService.notifyGuidancePlanStarted(
        guidancePlan.clientId,
        guidancePlanId,
        {
          type: guidancePlan.type,
          babalawoName: planWithDetails.babalawo.yorubaName || planWithDetails.babalawo.name,
          clientName: planWithDetails.client.name,
        }
      );
    }

    return updated;
  }

  /**
   * Update item completion status (Client can mark items as completed)
   */
  async updateItemCompletion(
    guidancePlanId: string,
    itemIndex: number,
    completed: boolean,
    currentUser: CurrentUserPayload
  ) {
    const guidancePlan = await this.prisma.guidancePlan.findUnique({
      where: { id: guidancePlanId },
    });

    if (!guidancePlan) {
      throw new NotFoundException('Guidance plan not found');
    }

    // Only client or babalawo can update item completion
    if (guidancePlan.clientId !== currentUser.id && guidancePlan.babalawoId !== currentUser.id) {
      throw new ForbiddenException('You do not have permission to update this guidance plan');
    }

    // Only allow updates when plan is IN_PROGRESS or COMPLETED
    if (!['IN_PROGRESS', 'COMPLETED'].includes(guidancePlan.status)) {
      throw new BadRequestException(
        `Cannot update items when plan status is ${guidancePlan.status}`
      );
    }

    // Parse items and update the specific item
    const items = guidancePlan.items as any[];
    if (itemIndex < 0 || itemIndex >= items.length) {
      throw new BadRequestException('Invalid item index');
    }

    items[itemIndex] = {
      ...items[itemIndex],
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    };

    // Update the guidance plan with modified items
    const updated = await this.prisma.guidancePlan.update({
      where: { id: guidancePlanId },
      data: {
        items,
      },
      include: {
        babalawo: { select: { id: true, name: true, yorubaName: true } },
        client: { select: { id: true, name: true } },
      },
    });

    this.logger.log(
      `Guidance plan ${guidancePlanId} item ${itemIndex} marked as ${completed ? 'completed' : 'incomplete'}`
    );

    return updated;
  }

  /**
   * Get completion progress for a guidance plan
   */
  async getCompletionProgress(guidancePlanId: string, currentUser: CurrentUserPayload) {
    const guidancePlan = await this.getGuidancePlan(guidancePlanId, currentUser);
    const items = guidancePlan.items as any[];

    const totalItems = items.length;
    const completedItems = items.filter((item) => item.completed === true).length;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      progressPercent,
      items: items.map((item, index) => ({
        index,
        name: item.name,
        completed: item.completed || false,
        completedAt: item.completedAt || null,
      })),
    };
  }
}
