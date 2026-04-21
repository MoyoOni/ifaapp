import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OralHistorySeedService } from '../backend/src/seeding/oral-history.seed.service';
import { SecretsService } from '../backend/src/secrets/secrets.service';
import { PrismaService } from '../backend/src/prisma/prisma.service';
import { AppModule } from '../backend/src/app.module';

async function seedOralHistory(dryRun: boolean = true) {
  let app: INestApplication | null = null;
  
  try {
    // Set the NODE_ENV to development for seeding purposes
    process.env.NODE_ENV = 'development';
    
    app = await NestFactory.create(AppModule);
    
    // Get the required services
    const seedService = app.get(OralHistorySeedService);
    const configService = app.get(ConfigService);
    
    console.log(`Starting oral history seeding${dryRun ? ' (dry run)' : ''}...`);
    
    // Run the seeding
    const result = await seedService.seed(dryRun);
    
    console.log('\nSeeding completed with result:');
    console.log(`- Total records: ${result.totalRecords}`);
    console.log(`- Dry run: ${result.dryRun}`);
    console.log(`- Validated: ${result.validated}`);
    
    if (result.errors) {
      console.error('\nErrors encountered:');
      result.errors.forEach(err => console.error(`- ${err}`));
    }
    
    if (!dryRun && result.validated) {
      console.log('\n✅ Oral history seeding completed successfully!');
    } else if (dryRun) {
      console.log('\n✅ Dry run completed successfully. No data was written to the database.');
    } else {
      console.log('\n❌ Seeding failed.');
    }
  } catch (error) {
    console.error('❌ Error during oral history seeding:', error.message);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Run the seeding
seedOralHistory(dryRun).then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});