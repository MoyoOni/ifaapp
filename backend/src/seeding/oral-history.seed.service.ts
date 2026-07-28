import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from '../secrets/secrets.service';
import * as fs from 'fs';
import * as path from 'path';

interface OralHistoryRecord {
  id: string;
  title: string;
  category: string;
  babalawoName?: string;
  recordingDate?: Date;
  tags: string[];
  content: string;
  sourceUrl?: string;
  publishedAt?: Date;
  createdBy: string; // This should be the admin user ID who creates these entries
}

interface SeedResult {
  totalRecords: number;
  dryRun: boolean;
  validated: boolean;
  errors?: string[];
}

@Injectable()
export class OralHistorySeedService {
  private readonly logger = new Logger(OralHistorySeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService
  ) {}

  /**
   * Validates the structure of oral history records
   */
  async validateStructure(data: OralHistoryRecord[]): Promise<boolean> {
    for (const record of data) {
      if (!record.id || !record.title || !record.category || !record.content || !record.createdBy) {
        this.logger.error(
          `Invalid record structure: missing required field in record ${record.id}`
        );
        return false;
      }

      // Validate tags array
      if (record.tags && !Array.isArray(record.tags)) {
        this.logger.error(`Invalid tags field in record ${record.id}: must be an array`);
        return false;
      }

      // Validate dates
      if (record.recordingDate && isNaN(new Date(record.recordingDate).getTime())) {
        this.logger.error(`Invalid recordingDate in record ${record.id}: ${record.recordingDate}`);
        return false;
      }

      if (record.publishedAt && isNaN(new Date(record.publishedAt).getTime())) {
        this.logger.error(`Invalid publishedAt in record ${record.id}: ${record.publishedAt}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Seeds the oral history data with validation
   */
  async seed(dryRun = true): Promise<SeedResult> {
    try {
      // Load seed data (we'll load from a JSON file or API)
      const seedData = await this.loadSeedData();

      if (!(await this.validateStructure(seedData))) {
        return {
          totalRecords: 0,
          dryRun,
          validated: false,
          errors: ['Seed data validation failed'],
        };
      }

      if (!dryRun) {
        // Clear existing oral history entries if this is a fresh seed.
        // ProBacklog-v1.md item #12 (soft-delete audit): SEED_ACTION=fresh
        // had no environment guard -- set that env var against a production
        // DATABASE_URL by mistake and this would permanently wipe every
        // community-submitted oral history entry (see
        // admin-cultural-content.service.ts's submitCommunityOralHistory),
        // not just the seed data it's meant to reset. Matches the same
        // NODE_ENV guard prisma/seed-ensure-admin.ts already uses for the
        // same class of risk.
        if (this.configService.get<string>('SEED_ACTION') === 'fresh') {
          if (this.configService.get<string>('NODE_ENV') === 'production') {
            throw new Error(
              'Refusing to run SEED_ACTION=fresh against a production environment -- this permanently deletes all oral history entries.'
            );
          }
          await this.prisma.oralHistoryEntry.deleteMany({});
          this.logger.log('Cleared existing oral history entries');
        }

        // Create records in batches to avoid timeouts
        const batchSize = 10;
        for (let i = 0; i < seedData.length; i += batchSize) {
          const batch = seedData.slice(i, i + batchSize);

          await this.prisma.$transaction(
            batch.map((record) =>
              this.prisma.oralHistoryEntry.upsert({
                where: { id: record.id },
                update: {
                  title: record.title,
                  category: record.category,
                  babalawoName: record.babalawoName,
                  recordingDate: record.recordingDate,
                  tags: record.tags,
                  content: record.content,
                  sourceUrl: record.sourceUrl,
                  publishedAt: record.publishedAt,
                  updatedAt: new Date(),
                },
                create: {
                  id: record.id,
                  title: record.title,
                  category: record.category,
                  babalawoName: record.babalawoName,
                  recordingDate: record.recordingDate,
                  tags: record.tags,
                  content: record.content,
                  sourceUrl: record.sourceUrl,
                  publishedAt: record.publishedAt,
                  createdBy: record.createdBy,
                },
              })
            )
          );

          this.logger.log(
            `Seeded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(seedData.length / batchSize)}`
          );
        }
      }

      this.logger.log(
        `${dryRun ? 'Dry run completed' : 'Seeding completed'} with ${seedData.length} records`
      );

      return {
        totalRecords: seedData.length,
        dryRun,
        validated: true,
      };
    } catch (error: any) {
      this.logger.error(`Error during seeding: ${error.message}`, error.stack);
      return {
        totalRecords: 0,
        dryRun,
        validated: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Loads seed data from JSON file or API
   */
  private async loadSeedData(): Promise<OralHistoryRecord[]> {
    // Determine the source of the seed data
    // Could be from a JSON file or from a remote API
    const dataSource = this.configService.get<string>('ORAL_HISTORY_DATA_SOURCE') || 'local';

    if (dataSource === 'local') {
      // Load from local JSON file
      try {
        // This assumes we have a seed data file
        const filePath = path.join(process.cwd(), 'data', 'oral-history-data.json');

        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.logger.log(`Loaded ${data.length} oral history records from local file`);
          return data;
        } else {
          this.logger.warn(`Local seed data file not found at ${filePath}, using sample data`);
          return this.getDefaultOralHistoryData();
        }
      } catch (error: any) {
        this.logger.warn(`Failed to load local seed data: ${error.message}, using sample data`);
        return this.getDefaultOralHistoryData();
      }
    } else {
      // Future implementation: load from remote API
      this.logger.warn('Remote data source not implemented, using sample data');
      return this.getDefaultOralHistoryData();
    }
  }

  /**
   * Provides default sample data for oral history
   */
  private getDefaultOralHistoryData(): OralHistoryRecord[] {
    // Find a valid admin user to assign as the creator
    // In a real scenario, this would be passed as a parameter or fetched from config
    const defaultCreatorId = 'admin-user-id'; // This should be replaced with an actual user ID

    return [
      {
        id: 'oh-001',
        title: 'The Origin of Ifá',
        category: 'creation-stories',
        babalawoName: 'Babaláwo Aládé',
        recordingDate: new Date('2024-05-15'),
        tags: ['creation', 'mythology', 'ifá'],
        content: 'This is the story of how Orúnmílà brought the art of Ifá to earth...',
        sourceUrl: 'https://example.com/oral-histories/ifá-origin',
        publishedAt: new Date('2024-05-20'),
        createdBy: defaultCreatorId,
      },
      {
        id: 'oh-002',
        title: 'Traditional Healing Methods',
        category: 'healing-practices',
        babalawoName: 'Babaláwo Okunade',
        recordingDate: new Date('2024-06-10'),
        tags: ['healing', 'medicine', 'herbs'],
        content: 'Our ancestors used various herbs and spiritual methods to heal...',
        publishedAt: new Date('2024-06-15'),
        createdBy: defaultCreatorId,
      },
      {
        id: 'oh-003',
        title: 'The Significance of Sacrifices',
        category: 'ritual-practices',
        babalawoName: 'Babaláwo Adeyemo',
        recordingDate: new Date('2024-07-22'),
        tags: ['sacrifice', 'ritual', 'communion'],
        content: 'Sacrifices in our tradition are not about taking life but about giving back...',
        publishedAt: new Date('2024-07-25'),
        createdBy: defaultCreatorId,
      },
    ];
  }
}
