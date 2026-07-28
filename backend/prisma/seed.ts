// Standalone: forum categories/covenant/starter-threads/real-temples + the
// Oral History Archive (which needs ConfigService/SecretsService, so it can't
// be run as a plain child-process step like the others).
//
// For a full restore of everything (users, temples, circles, forum, academy,
// moderation rules) after an empty/reset database, use `npm run seed:all`
// instead -- that's also what `prisma migrate reset` runs automatically.

import { PrismaClient } from '@prisma/client';
import { seedForumCategories } from './seed-forum-categories';
import { seedForumCovenant } from './seed-forum-covenant';
import { seedForumStarterThreads } from './seed-forum-starter-threads';
import { seedRealTemples } from './seed-real-temples';
import { OralHistorySeedService } from '../src/seeding/oral-history.seed.service';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from '../src/secrets/secrets.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Run all seeders
  await seedForumCategories(prisma);
  await seedForumCovenant(prisma);
  await seedForumStarterThreads(prisma);
  await seedRealTemples(prisma);

  // Run oral history seeding
  const configService = new ConfigService();
  const secretsService = new SecretsService(configService);
  const oralHistorySeedService = new OralHistorySeedService(prisma as any, configService, secretsService);
  
  // Run in non-dry-run mode since this is the actual seeding
  await oralHistorySeedService.seed(false);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });