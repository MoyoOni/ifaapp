// Makes sure at least one ADMIN account exists so the seed scripts that need
// to attribute content to an admin (forum covenant, cultural flag rules) have
// someone to use. Does nothing if an admin already exists -- safe to run any
// number of times, in any order, against any database.

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PLACEHOLDER_EMAIL = 'admin@example.com';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run seed scripts against a production environment.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    console.log(`  👤 Admin already exists: ${existingAdmin.name} (${existingAdmin.email})`);
    return;
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: PLACEHOLDER_EMAIL,
      name: 'Ìlú Àṣẹ Admin',
      passwordHash,
      role: 'ADMIN',
      verified: true,
    },
  });
  console.log(`  ✅ Created placeholder admin: ${admin.email} (password: TestPass123!)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
