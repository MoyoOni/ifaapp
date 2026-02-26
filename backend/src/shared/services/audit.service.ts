import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
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

      // Cast to `any` to tolerate mismatches between generated Prisma types
      // and the schema during iterative development. Long-term: run `prisma generate`.
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
        } as any,
      } as any);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error as auditing shouldn't break core functionality
    }
  }

  async getLogsForResource(resourceType: string, resourceId: string) {
    return await this.prisma.auditLog.findMany({
      where: ({ resourceType, resourceId } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getLogsByUser(userId: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: ({ userId } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getLogsByAction(action: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: ({ action } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getLogsByAdminSubRole(adminSubRole: string, limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: ({ user: { adminSubRole } } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getLogsByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
    return await this.prisma.auditLog.findMany({
      where: ({ createdAt: { gte: startDate, lte: endDate } } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getImpersonationLogs(limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: ({ action: 'IMPERSONATE_USER' } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }

  async getPiiRevealLogs(limit: number = 50) {
    return await this.prisma.auditLog.findMany({
      where: ({ action: 'REVEAL_PII' } as unknown) as any,
      orderBy: ({ createdAt: 'desc' } as unknown) as any,
      take: limit,
      include: ({
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            adminSubRole: true,
          },
        },
      } as unknown) as any,
    } as any);
  }
}