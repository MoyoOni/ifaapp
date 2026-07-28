import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AdminPromosService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async getAllPromos(includeInactive: boolean = false) {
    const promos = await this.prisma.promoCode.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the response to match the frontend expectations
    return promos.map((promo) => ({
      ...promo,
      creator: promo.creator,
      redemptions: promo._count.redemptions,
    }));
  }

  async createPromo(
    code: string,
    type: string,
    value: number,
    admin: CurrentUserPayload,
    maxUses?: number,
    expiresAt?: string,
    eligibleRoles: string[] = []
  ) {
    const promoCode = code.toUpperCase(); // Ensure code is uppercase

    try {
      const newPromo = await this.prisma.promoCode.create({
        data: {
          code: promoCode,
          type,
          value,
          maxUses: maxUses ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          eligibleRoles,
          createdBy: admin.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
            },
          },
        },
      });

      // Transform the response to match the frontend expectations
      return {
        ...newPromo,
        creator: newPromo.creator,
        redemptions: newPromo._count.redemptions,
      };
    } catch (error: any) {
      // Handle unique constraint violation for code
      if (error.code === 'P2002') {
        throw new BadRequestException('A promo code with this code already exists');
      }
      throw error;
    }
  }

  async updatePromo(id: string, isActive: boolean) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    const updatedPromo = await this.prisma.promoCode.update({
      where: { id },
      data: {
        isActive,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    // Transform the response to match the frontend expectations
    return {
      ...updatedPromo,
      creator: updatedPromo.creator,
      redemptions: updatedPromo._count.redemptions,
    };
  }

  /**
   * ProBacklog-v1.md structural fix: PromoRedemption.promoCode is
   * onDelete:Cascade, so an unguarded delete here would silently destroy
   * the redemption/discount history for every order that ever used this
   * code the moment an admin deleted it. Same "preserve history, block the
   * hard delete" posture as marketplace.service.ts's deleteProduct().
   *
   * P0-03: also logs to the real AuditLog table (previously nothing did
   * for this action) with a full snapshot of the deleted row as payload,
   * so a hard-deleted promo can still be identified/recreated later.
   */
  async deletePromo(id: string, currentUser: CurrentUserPayload) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    if (promo._count.redemptions > 0) {
      throw new BadRequestException(
        'This promo code has been redeemed and cannot be deleted, to preserve order discount history. Deactivate it instead.'
      );
    }

    await this.prisma.promoCode.delete({
      where: { id },
    });

    await this.auditService.logAction({
      adminId: currentUser.id,
      action: 'DELETE',
      entityType: 'PromoCode',
      entityId: id,
      payload: { snapshot: promo },
    });
  }
}
