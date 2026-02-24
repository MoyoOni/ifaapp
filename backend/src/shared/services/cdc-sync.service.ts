import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ChangeEvent {
  table: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  entityData?: any;
  timestamp: Date;
}

export interface SyncOperation {
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  data?: any;
}

/**
 * CDC (Change Data Capture) Sync Service — placeholder.
 * Will be implemented when OpenSearch / search infrastructure is added.
 */
@Injectable()
export class CdcSyncService implements OnModuleInit {
  private readonly logger = new Logger(CdcSyncService.name);

  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('CDC Sync service initialized (placeholder — no search backend configured)');
  }

  async syncRecord(operation: SyncOperation) {
    this.logger.warn(`syncRecord called but no search backend configured: ${operation.entity} ${operation.entityId}`);
  }

  async queueSyncOperation(operation: SyncOperation) {
    this.logger.warn(`queueSyncOperation called but no queue backend configured: ${operation.entity} ${operation.entityId}`);
  }

  async fullResync(entity: string) {
    this.logger.warn(`fullResync called but no search backend configured: ${entity}`);
  }
}
