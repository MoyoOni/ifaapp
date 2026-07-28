/**
 * COMMUNITY_BACKLOG.md FOR-001 — Cultural Authenticity Safeguards
 *
 * "Blacklist of prohibited topics (Akose discussions, counterfeits,
 * misappropriated sacred practices) as a documented ContentFlagRule config,
 * not just ad-hoc flags." The human review queue (heldForReview,
 * admin-integrity-tab.tsx) and community reporting already exist -- this
 * seed is specifically the curated reference list elders review against,
 * not a new moderation mechanism.
 *
 * Deliberately NOT auto-enforced: ContentFlagRule is read by
 * admin-integrity.service.ts's getRules() but nothing in the post/thread
 * creation path checks against it -- same as the identical, pre-existing
 * gap already documented on SHOP_BACKLOG.md's MSP-015 (heldForReview is
 * never set by any community-facing action for ForumPost). Wiring real-time
 * keyword-based auto-flagging into forum.service.ts would be a genuine,
 * separate engineering decision -- it has real false-positive risk against
 * ordinary cultural conversation (e.g. "Ẹbọ" is a routine, everyday Ifá
 * term, not something to flag) and deserves its own product call, not a
 * silent side effect of seeding reference data. Left as a follow-up.
 *
 * Safe to re-run: upserted by (type, value) — skips existing entries.
 * Run: npm run seed:cultural-flag-rules
 * Requires: at least one ADMIN user in the database.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedRule {
  type: 'KEYWORD' | 'CATEGORY_MOD';
  value: string;
  reason: string;
}

const RULES: SeedRule[] = [
  // Akose discussions -- Akose (a prepared spiritual work/charm) is meant to
  // be provided through the prescription module after real divination, same
  // restriction already enforced for marketplace listings
  // (marketplace.service.ts's createProduct). The concept itself is a
  // normal, healthy topic; these flag specifically offers to prepare, sell,
  // or trade Akose ad-hoc, outside that process.
  {
    type: 'KEYWORD',
    value: 'akose for sale',
    reason:
      'Akose (prepared spiritual work) can only be provided through the prescription module after ' +
      'proper divination, not sold ad-hoc. Discussing what Akose is remains fine; offering to sell or ' +
      'trade one is the concern.',
  },
  {
    type: 'KEYWORD',
    value: 'selling akose',
    reason: 'Same restriction as "akose for sale" — Akose cannot be sold or traded outside the prescription module.',
  },
  {
    type: 'KEYWORD',
    value: 'diy akose',
    reason:
      'Akose prepared without proper divination/training risks real harm to the person it\'s prepared for — ' +
      'flag DIY preparation guidance for elder review, not general questions about what Akose is.',
  },

  // Counterfeits -- same "authentic, not replica" principle already
  // enforced for marketplace listings, extended to forum discussion that
  // facilitates or promotes counterfeit sacred items.
  {
    type: 'KEYWORD',
    value: 'counterfeit',
    reason: 'Watch for discussion facilitating or promoting counterfeit/replica sacred items — undermines cultural authenticity and can mislead newcomers.',
  },
  {
    type: 'KEYWORD',
    value: 'replica orisha',
    reason: 'Flag posts promoting replica/imitation Orisha items as authentic — same concern as marketplace counterfeit restrictions.',
  },

  // Misappropriated sacred practices -- initiation status and lineage
  // credentials are not transactional; oath-bound/initiatory knowledge
  // should stay within its lineage (same principle already stated in the
  // Cross-Cultural Practice Bridges Circle's guidelines, FOR-005).
  {
    type: 'KEYWORD',
    value: 'initiation for sale',
    reason: 'Initiation and lineage credentials cannot be bought or fast-tracked — flag any offer to sell or shortcut initiation status.',
  },
  {
    type: 'KEYWORD',
    value: 'buy initiation',
    reason: 'Same concern as "initiation for sale" — initiation is not a transactional purchase.',
  },
  {
    type: 'KEYWORD',
    value: 'oath-bound',
    reason:
      'Not inherently a violation — but a post claiming to reveal oath-bound/initiatory knowledge warrants a ' +
      'look, since that knowledge is meant to stay within its lineage.',
  },
];

async function main() {
  console.log('🛡️  Seeding cultural authenticity flag rules (FOR-001)...\n');

  const admin =
    (await prisma.user.findFirst({
      where: { email: 'ifamoyooni@outlook.com' },
      select: { id: true, name: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true },
    }));

  if (!admin) {
    console.error('❌ No ADMIN user found in database. Please create an admin user first.');
    process.exit(1);
  }

  console.log(`  👤 Using admin: ${admin.name} (${admin.id})\n`);

  let created = 0;
  let skipped = 0;

  for (const rule of RULES) {
    const existing = await prisma.contentFlagRule.findFirst({
      where: { type: rule.type, value: rule.value },
    });

    if (existing) {
      console.log(`  ⏭️  Exists: [${rule.type}] "${rule.value}"`);
      skipped++;
      continue;
    }

    await prisma.contentFlagRule.create({
      data: {
        type: rule.type,
        value: rule.value,
        reason: rule.reason,
        createdBy: admin.id,
      },
    });
    console.log(`  ✅ Created: [${rule.type}] "${rule.value}"`);
    created++;
  }

  console.log(`\n📊 Done: ${created} created, ${skipped} already existed`);
  console.log('🎉 Cultural authenticity flag rules seeded!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
