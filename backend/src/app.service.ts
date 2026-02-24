import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QueueService } from './shared/services/queue.service';
import { CdcSyncService } from './shared/services/cdc-sync.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly cdcSyncService: CdcSyncService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing application services...');
    
    // Setup common queue processors
    await this.queueService.setupCommonProcessors();
    
    // CDC sync is a placeholder — no search backend configured yet
    
    this.logger.log('Application services initialized successfully');
  }

  getHello(): string {
    return 'Welcome to the Ìlú Àṣẹ Platform!';
  }
}