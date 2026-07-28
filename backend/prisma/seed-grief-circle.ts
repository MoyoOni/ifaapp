/**
 * COMMUNITY_BACKLOG.md FOR-015 — Grief, Healing & Ancestral Support Circle
 *
 * Standing up the Circle itself is a near-zero-engineering task per FOR-015's
 * own notes: Circle.topics already supports this, it just needs creating and
 * stewarding. Safe to re-run: upserts by slug.
 * Requires at least one ADMIN user in the database.
 * Run: npm run seed:grief-circle
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'grief-healing-ancestral-support';

async function main() {
  console.log('🕊️  Seeding Grief, Healing & Ancestral Support Circle...\n');

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
    "A space to grieve, remember, and heal together — for loss of loved ones, transitions, and ancestral connection. " +
    "Share what you're carrying, or simply sit with others who understand. " +
    "For remembrance and offerings, visit the Ancestral Remembrance Wall (/remembrance-wall). " +
    "If you're in crisis or immediate danger, please contact your local emergency services or a crisis hotline — " +
    "this platform does not yet offer same-day spiritual crisis response. For non-emergency support, reach out to hello@iluase.com.";

  if (existing) {
    await prisma.circle.update({
      where: { id: existing.id },
      data: { description, topics: ['grief', 'healing', 'ancestral-veneration', 'remembrance'], active: true },
    });
    console.log(`  ⏭️  Circle already exists (description/topics refreshed): ${SLUG}`);
  } else {
    await prisma.circle.create({
      data: {
        name: 'Grief, Healing & Ancestral Support',
        description,
        slug: SLUG,
        creatorId: admin.id,
        privacy: 'PUBLIC',
        topics: ['grief', 'healing', 'ancestral-veneration', 'remembrance'],
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
    console.log(`  ✅ Created: Grief, Healing & Ancestral Support (/${SLUG})`);
  }

  console.log('\n🎉 Grief Circle seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
