/**
 * V9 Community Covenant Seed — 2 pinned, locked threads in Ìdágbasílẹ̀ & Ìlànà
 *
 * Safe to re-run: upserts by title within the category.
 * Requires at least one ADMIN user in the database.
 * Run: npm run seed:forum-covenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COVENANT_THREADS = [
  {
    title: '📜 Community Covenant — Read Before You Post',
    content: `Ẹ káàárọ̀, ẹ káàbọ̀. Welcome to Ìlú Àṣẹ.

This is a living room, not a debate hall. Every word carries Àṣẹ — choose them wisely.

---

## Our Shared Values

**1. Respect the Culture**
Ifá and Yorùbá traditions are sacred. No mockery, no appropriation, no shortcuts.
Disagreements are welcome; disrespect is not.

**2. Speak from Experience, Not Assumptions**
Share what you know. If you are uncertain, say so. This protects the integrity of the knowledge.

**3. Protect the Vulnerable**
Seekers are in a delicate space. No judgment, no exploitation, no predatory behavior.
If you see someone in crisis, respond with compassion — or tag a moderator.

**4. No Gatekeeping**
Ifá belongs to everyone ready to learn. Do not use lineage or credentials as weapons.

**5. Commercial Activity Has Its Space**
The Marketplace is for commerce. The forum is for community. Do not turn threads into sales pitches.

**6. Privacy is Sacred**
What is shared in trust stays in trust. Do not screenshot, share, or quote members outside this space without consent.

**7. Moderation is Final**
Our moderators are community servants, not adversaries. Appeals go to admin via direct message.

---

## Consequences

- **First offense:** Gentle correction
- **Second offense:** Post removal + warning
- **Third offense:** Temporary suspension
- **Severe violations (harassment, exploitation):** Permanent ban

---

*Ìwà l'ẹwà — Character is beauty.*

This thread is locked. Questions about the covenant? Open a thread in this category.`,
    tags: ['covenant', 'guidelines', 'welcome'],
    isPinned: true,
    isLocked: true,
    isApproved: true,
  },
  {
    title: '👋 Ẹ káàbọ̀ — Introduce Yourself Here',
    content: `This is your first thread.

Tell us:

1. **Your name** (or the name you go by in this community)
2. **Where you are in your spiritual journey** — just starting out? Years deep? Still questioning?
3. **What brought you to Ìlú Àṣẹ**
4. **One thing you hope to learn or share**

---

*No journey is too new. No question is too simple. Ẹ káàbọ̀.*

---

**Note:** This thread is pinned as a permanent welcome space. Anonymous introductions are also welcome — see the Seeker Questions category if you prefer privacy.`,
    tags: ['introductions', 'welcome', 'community'],
    isPinned: true,
    isLocked: false,
    isApproved: true,
  },
];

async function main() {
  console.log('📜 Seeding Community Covenant threads...\n');

  // Prefer the platform founder's own account as author; fall back to any admin.
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

  // Find the Ìdágbasílẹ̀ & Ìlànà category
  const category = await prisma.forumCategory.findUnique({
    where: { slug: 'idagbasile-ilana' },
  });

  if (!category) {
    console.error('❌ Category "idagbasile-ilana" not found. Run seed:forum-categories first.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const thread of COVENANT_THREADS) {
    const existing = await prisma.forumThread.findFirst({
      where: {
        categoryId: category.id,
        title: thread.title,
      },
    });

    if (existing) {
      // Update pin/lock state without changing content
      await prisma.forumThread.update({
        where: { id: existing.id },
        data: {
          isPinned: thread.isPinned,
          isLocked: thread.isLocked,
          isApproved: thread.isApproved,
        },
      });
      console.log(`  ⏭️  Exists (updated flags): ${thread.title.slice(0, 50)}...`);
      skipped++;
    } else {
      await prisma.forumThread.create({
        data: {
          categoryId: category.id,
          authorId: admin.id,
          title: thread.title,
          content: thread.content,
          isPinned: thread.isPinned,
          isLocked: thread.isLocked,
          isApproved: thread.isApproved,
          status: 'ACTIVE',
        },
      });

      // Bump category thread count
      await prisma.forumCategory.update({
        where: { id: category.id },
        data: { threadCount: { increment: 1 } },
      });

      console.log(`  ✅ Created: ${thread.title.slice(0, 60)}`);
      created++;
    }
  }

  console.log(`\n📊 Done: ${created} created, ${skipped} already existed`);
  console.log('🎉 Community Covenant seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
