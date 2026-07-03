import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migration script for onboarding email table...');
  
  // Ensure the OnboardingEmail table exists
  // This script primarily serves as a validation that the table exists
  try {
    // Try to query the table to confirm it exists
    await prisma.$queryRaw`SELECT 1 FROM "OnboardingEmail" LIMIT 1`;
    console.log('✓ OnboardingEmail table already exists');
  } catch (error) {
    console.log('OnboardingEmail table does not exist yet, please run the migration:');
    console.log('npx prisma migrate dev --name add-onboarding-email-table');
    throw error;
  }
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });