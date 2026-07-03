/**
 * Database Seeding Script
 * Populates database with initial data for development/testing
 * Run from backend directory:
 *   npx ts-node ../scripts/db-seed.ts
 * 
 * Or from root:
 *   cd backend && npx ts-node ../scripts/db-seed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const babalawoPasswordHash = await bcrypt.hash('babalawo123', 10);
  const clientPasswordHash = await bcrypt.hash('client123', 10);

  // Seed admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ilease.ng' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      verified: true,
      hasOnboarded: true,
    },
    create: {
      email: 'admin@ilease.ng',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      verified: true,
      hasOnboarded: true,
      culturalLevel: 'Omo Awo',
    },
  });

  console.log('✅ Admin user created/updated:', admin.email);
  console.log('   Password: admin123');

  // Seed example Babalawo
  const babalawo = await prisma.user.upsert({
    where: { email: 'babalawo@ilease.ng' },
    update: {
      passwordHash: babalawoPasswordHash,
      role: 'BABALAWO',
      verified: false,
      hasOnboarded: true,
    },
    create: {
      email: 'babalawo@ilease.ng',
      name: 'Oluwo Kolawole',
      yorubaName: 'Ifayemi',
      passwordHash: babalawoPasswordHash,
      role: 'BABALAWO',
      verified: false, // Not verified yet - needs verification application
      hasOnboarded: true,
      bio: 'Senior advisor with expertise in Odu Ifá interpretation',
      location: 'Lagos, Nigeria',
      culturalLevel: 'Aremo',
    },
  });

  console.log('✅ Example Babalawo created/updated:', babalawo.email);
  console.log('   Password: babalawo123');

  // Seed example Client
  const client = await prisma.user.upsert({
    where: { email: 'client@ilease.ng' },
    update: {
      passwordHash: clientPasswordHash,
      role: 'CLIENT',
      verified: false,
      hasOnboarded: true,
    },
    create: {
      email: 'client@ilease.ng',
      name: 'Tunde Adeyemi',
      yorubaName: 'Babatunde',
      passwordHash: clientPasswordHash,
      role: 'CLIENT',
      verified: false,
      hasOnboarded: true,
      bio: 'Seeker of Isese/Ifá wisdom',
      location: 'London, UK',
      culturalLevel: 'Akeko',
    },
  });

  console.log('✅ Example Client created:', client.email);
  console.log('   Password: client123');

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
