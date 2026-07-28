/**
 * COMMUNITY_BACKLOG.md FOR-005 — Cross-Cultural Practice Bridges
 *
 * Standing up the Circle itself is a near-zero-engineering task, same as
 * FOR-013/FOR-015/FOR-018/FOR-021's Circle seeds: Circle.topics/description
 * already support this, it just needs creating and stewarding. Guidelines
 * for respectful inter-tradition dialogue and expert-facilitator identification
 * are content/operational tasks, not engineering -- folded into the Circle's
 * description here rather than a new content model.
 * Safe to re-run: upserts by slug.
 * Requires at least one ADMIN user in the database.
 * Run: npm run seed:cross-cultural-circle
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'cross-cultural-bridges';

async function main() {
  console.log('🌍 Seeding Cross-Cultural Practice Bridges Circle...\n');

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
    'A space for respectful dialogue between Ifá/Òrìṣà practice and other African and Afro-diasporic ' +
    'spiritual traditions (Vodou, Santería/Lucumí, Candomblé, Hoodoo, and beyond). Come to compare notes, ' +
    'ask honest questions, and learn where our paths overlap and where they differ.\n\n' +
    'Guidelines for respectful inter-tradition communication:\n' +
    '• Speak from your own practice and experience, not as a spokesperson for a tradition you were not raised or initiated in.\n' +
    '• Questions are welcome; assumptions of equivalence between distinct traditions are not — similar is not the same.\n' +
    '• Sacred and initiatory knowledge stays within its lineage. If a question would ask someone to share what is oath-bound, ' +
    'expect (and respect) a gentle decline.\n' +
    '• Disagreement about practice is fine; disrespect of another tradition is not.\n\n' +
    'This Circle uses the same moderation available to every Circle on the platform. If a conversation needs an elder\'s ' +
    'attention, a moderator can act on the Circle directly — post-level flagging for Circle discussions is not yet built ' +
    'platform-wide (tracked as a follow-up).';

  if (existing) {
    await prisma.circle.update({
      where: { id: existing.id },
      data: {
        description,
        topics: ['cross-cultural', 'dialogue', 'afro-diasporic', 'comparative-practice'],
        active: true,
      },
    });
    console.log(`  ⏭️  Circle already exists (description/topics refreshed): ${SLUG}`);
  } else {
    await prisma.circle.create({
      data: {
        name: 'Cross-Cultural Practice Bridges',
        description,
        slug: SLUG,
        creatorId: admin.id,
        privacy: 'PUBLIC',
        topics: ['cross-cultural', 'dialogue', 'afro-diasporic', 'comparative-practice'],
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
    console.log(`  ✅ Created: Cross-Cultural Practice Bridges (/${SLUG})`);
  }

  console.log('\n🎉 Cross-Cultural Practice Bridges Circle seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
