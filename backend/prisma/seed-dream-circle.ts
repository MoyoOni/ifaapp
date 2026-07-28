/**
 * COMMUNITY_BACKLOG.md FOR-021 — Dream Sharing & Interpretation Circle
 *
 * Standing up the Circle itself is a near-zero-engineering task per FOR-021's
 * own notes: Circle.topics already supports this, it just needs creating.
 * The private journal + interpretation-request loop lives at /dreams
 * (dream.module.ts), separate from this discussion space.
 * Safe to re-run: upserts by slug.
 * Requires at least one ADMIN user in the database.
 * Run: npm run seed:dream-circle
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'dream-sharing-interpretation';

async function main() {
  console.log('🌙 Seeding Dream Sharing & Interpretation Circle...\n');

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
    'Dreaming is sacred in Yoruba tradition — handle with care. Discuss dream patterns and traditions here. ' +
    'To record a private dream journal entry or request a Babalawo\'s interpretation, visit the Dream Journal (/dreams).';

  if (existing) {
    await prisma.circle.update({
      where: { id: existing.id },
      data: { description, topics: ['dreams', 'interpretation', 'ifa-divination'], active: true },
    });
    console.log(`  ⏭️  Circle already exists (description/topics refreshed): ${SLUG}`);
  } else {
    await prisma.circle.create({
      data: {
        name: 'Dream Sharing & Interpretation',
        description,
        slug: SLUG,
        creatorId: admin.id,
        privacy: 'PUBLIC',
        topics: ['dreams', 'interpretation', 'ifa-divination'],
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
    console.log(`  ✅ Created: Dream Sharing & Interpretation (/${SLUG})`);
  }

  console.log('\n🎉 Dream Circle seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
