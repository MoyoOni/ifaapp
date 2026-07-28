import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AdminPromosService {
  constructor(private prisma: PrismaService) {}

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

  async deletePromo(id: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    await this.prisma.promoCode.delete({
      where: { id },
    });
  }
}
