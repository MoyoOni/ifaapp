import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend/src/app.module.ts';
import { OralHistorySeedService } from '../backend/src/seeding/oral-history.seed.service.ts';

async function runOralHistorySeeding(dryRun: boolean = true) {
  let app = null;
  
  try {
    // Set environment
    process.env.NODE_ENV = 'development';
    
    app = await NestFactory.create(AppModule);
    await app.init();
    
    const seedService = app.get(OralHistorySeedService);
    
    console.log(`Starting oral history seeding${dryRun ? ' (dry run)' : ''}...`);
    
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
    
    return result;
  } catch (error) {
    console.error('❌ Error during oral history seeding:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Execute the seeding
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  runOralHistorySeeding(dryRun)
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { runOralHistorySeeding };