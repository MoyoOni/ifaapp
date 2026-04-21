import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminPlatformSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
  }

  async updateSettings(data: Record<string, unknown>, adminId: string) {
    const prev = await this.getSettings();
    const updated = await this.prisma.platformSettings.update({
      where: { id: 'singleton' },
      data: { ...(data as any), updatedBy: adminId },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId, action: 'PLATFORM_SETTINGS_UPDATED',
        resourceType: 'PlatformSettings', resourceId: 'singleton',
        previousValues: prev as any, newValues: data as any,
      },
    });
    return updated;
  }
}
