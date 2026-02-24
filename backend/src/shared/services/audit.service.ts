import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/services/prisma.service';
import { User } from '@prisma/client';
import { PiiMaskingUtil } from '../utils/pii-masking.util';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
          previousValues: maskedPreviousValues as any,
          newValues: maskedNewValues as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error as auditing shouldn't break core functionality
    }
  }

  async getLogsForResource(resourceType: string, resourceId: string) {
    return await this.prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,  // Include admin sub-role for filtering
          },
        },
      },
    });
  }

  async getLogsByUser(userId: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }

  async getLogsByAction(action: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: {
        action,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }

  async getLogsByAdminSubRole(adminSubRole: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: {
        user: {
          adminSubRole,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }

  async getLogsByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
    return await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }

  async getImpersonationLogs(limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: {
        action: 'IMPERSONATE_USER',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }

  async getPiiRevealLogs(limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: {
        action: 'REVEAL_PII',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      },
    });
  }
}