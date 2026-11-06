import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PiiMaskingUtil } from '../utils/pii-masking.util';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      // Mask sensitive values before storing
      const maskedPreviousValues = entry.previousValues
        ? PiiMaskingUtil.maskObject(entry.previousValues)
        : undefined;

      const maskedNewValues = entry.newValues
        ? PiiMaskingUtil.maskObject(entry.newValues)
        : undefined;

      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          previousValues: maskedPreviousValues as Prisma.InputJsonValue | undefined,
          newValues: maskedNewValues as Prisma.InputJsonValue | undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw error as auditing shouldn't break core functionality
    }
  }
}
