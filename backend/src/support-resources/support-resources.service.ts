import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportResourceDto, UpdateSupportResourceDto } from './dto/support-resource.dto';

// FOR-015/FOR-017: the support directory members are pointed to in distress
// or grief. Admins enter the organisations; nothing here is hard-coded.
@Injectable()
export class SupportResourcesService {
  constructor(private prisma: PrismaService) {}

  /** What members see: active entries only. */
  findActive() {
    return this.prisma.supportResource.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, country: true, phone: true, url: true, helpsWith: true, description: true },
    });
  }

  findAll() {
    return this.prisma.supportResource.findMany({ orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async create(dto: CreateSupportResourceDto) {
    if (!dto.phone && !dto.url) throw new BadRequestException('Add a phone number or a website so members can reach them');
    return this.prisma.supportResource.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupportResourceDto) {
    const existing = await this.prisma.supportResource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Support resource not found');
    const phone = dto.phone !== undefined ? dto.phone : existing.phone;
    const url = dto.url !== undefined ? dto.url : existing.url;
    if (!phone && !url) throw new BadRequestException('Add a phone number or a website so members can reach them');
    return this.prisma.supportResource.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.prisma.supportResource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Support resource not found');
    await this.prisma.supportResource.delete({ where: { id } });
    return { deleted: true };
  }
}
