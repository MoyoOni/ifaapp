import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateServiceOfferingDto, UpdateServiceOfferingDto } from './dto/service-offering.dto';

@Injectable()
export class ServiceOfferingsService {
  constructor(private prisma: PrismaService) {}

  async getForBabalawo(babalawoId: string) {
    return this.prisma.serviceOffering.findMany({
      where: { babalawoId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(babalawoId: string, dto: CreateServiceOfferingDto, currentUser: CurrentUserPayload) {
    this.assertOwnerOrAdmin(babalawoId, currentUser);

    return this.prisma.serviceOffering.create({
      data: { babalawoId, ...dto },
    });
  }

  async update(
    babalawoId: string,
    id: string,
    dto: UpdateServiceOfferingDto,
    currentUser: CurrentUserPayload
  ) {
    this.assertOwnerOrAdmin(babalawoId, currentUser);

    const offering = await this.prisma.serviceOffering.findUnique({ where: { id, deletedAt: null } });
    if (!offering || offering.babalawoId !== babalawoId) {
      throw new NotFoundException('Service offering not found');
    }

    return this.prisma.serviceOffering.update({ where: { id }, data: dto });
  }

  // ProBacklog-v1.md item #12 (soft-delete audit): a babalawo's own
  // service-catalog listing -- soft-deleted like DreamEntry/etc; every read
  // above filters deletedAt.
  async remove(babalawoId: string, id: string, currentUser: CurrentUserPayload) {
    this.assertOwnerOrAdmin(babalawoId, currentUser);

    const offering = await this.prisma.serviceOffering.findUnique({ where: { id, deletedAt: null } });
    if (!offering || offering.babalawoId !== babalawoId) {
      throw new NotFoundException('Service offering not found');
    }

    await this.prisma.serviceOffering.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  private assertOwnerOrAdmin(babalawoId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== babalawoId) {
      throw new ForbiddenException('You can only manage your own service offerings');
    }
  }
}
