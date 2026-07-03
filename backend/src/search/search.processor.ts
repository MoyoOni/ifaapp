import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SearchService } from './search.service';

@Processor('search')
export class SearchProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchProcessor.name);

  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing search indexing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'indexEntity':
        const { entityType, entityId, data } = job.data;
        return this.searchService.handleIndexing(entityType, entityId, data);

      case 'removeEntity':
        const { type, id } = job.data;
        return this.searchService.handleRemoval(type, id);

      default:
        this.logger.log(`Unknown search job type: ${job.name}`);
        throw new Error(`Unknown search job type: ${job.name}`);
    }
  }
}
