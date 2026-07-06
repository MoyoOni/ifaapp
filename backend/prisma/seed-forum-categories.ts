/**
 * V9 Forum Categories Seed — 9 culturally-aligned categories for Ìlú Àṣẹ Forum
 *
 * Safe to re-run: uses upsert keyed on slug — skips existing entries.
 * Run: npm run seed:forum-categories
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: 'idagbasile-ilana',
    name: 'Ìdágbasílẹ̀ & Ìlànà',
    description: 'Welcome, introductions & community guidelines',
    icon: '🏛️',
    order: 1,
    isTeachings: false,
  },
  {
    slug: 'ifa-divination-studies',
    name: 'Ifá & Divination Studies',
    description: 'Odù, divination tools, ethics in practice',
    icon: '🔮',
    order: 2,
    isTeachings: false,
  },
  {
    slug: 'healing-herbs-wellness',
    name: 'Healing, Herbs & Spiritual Wellness',
    description: 'Ewe, spiritual baths, mental health & alignment',
    icon: '🌿',
    order: 3,
    isTeachings: false,
  },
  {
    slug: 'yoruba-language-culture',
    name: 'Yorùbá Language & Culture',
    description: 'Proverbs, language practice, diaspora stories',
    icon: '🗣️',
    order: 4,
    isTeachings: false,
  },
  {
    slug: 'temple-connections-events',
    name: 'Temple Connections & Events',
    description: 'Temple spotlights, travel tips, event announcements',
    icon: '👥',
    order: 5,
    isTeachings: false,
  },
  {
    slug: 'seeker-questions',
    name: 'Seeker Questions — No Judgment',
    description: 'New to Ifá? Ask anything — no judgment here',
    icon: '❓',
    order: 6,
    isTeachings: false,
  },
  {
    slug: 'resources-recommendations',
    name: 'Resources & Recommendations',
    description: 'Books, apps, vendor reviews, study guides',
    icon: '📚',
    order: 7,
    isTeachings: false,
  },
  {
    slug: 'culture-lifestyle',
    name: 'Culture & Lifestyle',
    description: 'Music, fashion, food, art & respectful humor',
    icon: '🎵',
    order: 8,
    isTeachings: false,
  },
  {
    slug: 'practitioners-inner-circle',
    name: "Practitioners' Inner Circle",
    description: 'Verified practitioners only — peer consultation & ethics',
    icon: '🔐',
    order: 9,
    isTeachings: true, // requires mod approval; BABALAWO-only
  },
  {
    slug: 'youth-corner',
    name: '🌱 Youth Corner',
    description: "For under-25s navigating tradition & modern life",
    icon: '🌱',
    order: 10,
    isTeachings: false,
  },
];

const ORAL_HISTORY_THREAD_TITLE = 'Share Your Story — Oral History Archive';
const ORAL_HISTORY_THREAD_CONTENT = `Welcome to the Oral History Archive — a living record of our community's stories.

This thread is a space for diaspora memory, personal encounters with Ifá, and the moments that called us home to the tradition.

**Share your story. Consider these prompts:**

- How did you first encounter Ifá or Yoruba spiritual practice?
- What was the moment everything shifted — when you knew this path was yours?
- Share a story passed down from your family about Orisa, ancestors, or tradition.
- What does it mean to carry this culture across generations and across oceans?
- A memory of a ceremony, a divination, a dream that changed you.

There are no right or wrong stories here. Every account is an offering.

*Ìtàn ni ìrántí àwọn ẹ̀dá — History is the memory of humanity.*`;

async function main() {
  console.log('🏛️  Seeding forum categories...\n');

  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const result = await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: {
        // Update description/icon/order in case they changed — leave threadCount alone
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
        isTeachings: cat.isTeachings,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        order: cat.order,
        isTeachings: cat.isTeachings,
        isActive: true,
        threadCount: 0,
      },
    });

    const wasNew = result.createdAt.getTime() === result.updatedAt.getTime();
    if (wasNew) {
      console.log(`  ✅ Created: ${cat.icon}  ${cat.name}`);
      created++;
    } else {
      console.log(`  ⏭️  Exists:  ${cat.icon}  ${cat.name}`);
      skipped++;
    }
  }

  console.log(`\n📊 Done: ${created} created, ${skipped} already existed`);
  console.log('🎉 Forum categories seeded successfully!\n');

  // ── F9-904: Oral History Archive pinned thread ─────────────────────────────
  // Seed a pinned anchor thread in Yorùbá Language & Culture for community stories.
  // Upsert-safe: keyed on title so re-runs are idempotent.
  console.log('📜  Seeding Oral History Archive thread...');

  const cultureCategory = await prisma.forumCategory.findUnique({
    where: { slug: 'yoruba-language-culture' },
    select: { id: true },
  });

  if (!cultureCategory) {
    console.log('  ⚠️  yoruba-language-culture category not found — skipping oral history thread');
    return;
  }

  // Prefer the platform founder's own account as thread author; fall back to
  // any admin, then any user.
  const adminUser = await prisma.user.findFirst({
    where: { email: 'ifamoyooni@outlook.com' },
    select: { id: true },
  }) ?? await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  }) ?? await prisma.user.findFirst({ select: { id: true } });

  if (!adminUser) {
    console.log('  ⚠️  No users in DB — skipping oral history thread (run after first admin registers)');
    return;
  }

  const existingThread = await prisma.forumThread.findFirst({
    where: {
      title: ORAL_HISTORY_THREAD_TITLE,
      categoryId: cultureCategory.id,
    },
    select: { id: true },
  });

  if (existingThread) {
    console.log('  ⏭️  Oral History Archive thread already exists');
  } else {
    await prisma.forumThread.create({
      data: {
        title: ORAL_HISTORY_THREAD_TITLE,
        authorId: adminUser.id,
        categoryId: cultureCategory.id,
        content: ORAL_HISTORY_THREAD_CONTENT,
        tags: ['oral-history'],
        isPinned: true,
        isApproved: true,
        isLocked: false, // open for replies
        status: 'OPEN',
        viewCount: 0,
        postCount: 0,
      },
    });
    console.log('  ✅ Created: 📜 Oral History Archive thread');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
