import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogParams {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) { }

  async logAction(params: AuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: params.adminId,
          action: params.action,
          resourceType: params.entityType,
          resourceId: params.entityId,
          metadata: params.payload || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  async getAuditLogs(filters: {
    adminId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.adminId) where.userId = filters.adminId;
    if (filters.entityType) where.resourceType = filters.entityType;
    if (filters.action) where.action = filters.action;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }
}
