/**
 * COMMUNITY_BACKLOG.md FOR-018 — Community Healing & Reconciliation Circle
 *
 * Standing up the Circle itself is a near-zero-engineering task, same as
 * FOR-013/FOR-015/FOR-021's Circle seeds: Circle.topics already supports
 * this, it just needs creating. The actual case-reporting/elder-mediation
 * loop lives at /healing (healing.module.ts), separate from this
 * discussion/support space.
 * Safe to re-run: upserts by slug.
 * Requires at least one ADMIN user in the database.
 * Run: npm run seed:healing-circle
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'healing-reconciliation';

async function main() {
  console.log('🕊️  Seeding Healing & Reconciliation Circle...\n');

  const admin = await prisma.user.findFirst({
    where: { email: 'ifamoyooni@outlook.com' },
    select: { id: true, name: true },
  }) ?? await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, name: true },
  });

  if (!admin) {
    console.error('❌ No ADMIN user found in database. Please create an admin user first.');
    process.exit(1);
  }

  console.log(`  👤 Using admin: ${admin.name} (${admin.id})\n`);

  const existing = await prisma.circle.findUnique({ where: { slug: SLUG } });

  const description =
    'Healing is a practice, not a one-time event. A space for community healing circles, restoration, and ' +
    'learning from conflict together. To bring a specific concern or conflict to an elder for private, ' +
    "restorative mediation, visit Healing & Reconciliation (/healing) rather than posting it here.";

  if (existing) {
    await prisma.circle.update({
      where: { id: existing.id },
      data: { description, topics: ['healing', 'reconciliation', 'restoration'], active: true },
    });
    console.log(`  ⏭️  Circle already exists (description/topics refreshed): ${SLUG}`);
  } else {
    await prisma.circle.create({
      data: {
        name: 'Healing & Reconciliation',
        description,
        slug: SLUG,
        creatorId: admin.id,
        privacy: 'PUBLIC',
        topics: ['healing', 'reconciliation', 'restoration'],
        status: 'ACTIVE',
        active: true,
        approvedAt: new Date(),
        approvedBy: admin.id,
        members: {
          create: {
            userId: admin.id,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
        },
        memberCount: 1,
      },
    });
    console.log(`  ✅ Created: Healing & Reconciliation (/${SLUG})`);
  }

  console.log('\n🎉 Healing Circle seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
