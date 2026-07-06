/**
 * Forum Starter Threads Seed — 7 culturally-rich opening threads for Ìlú Àṣẹ Forum
 *
 * Safe to re-run: upserted by (title, categoryId) — skips existing entries.
 * Run: npm run seed:forum-starter-threads
 *
 * Requires: categories already seeded (npm run seed:forum-categories)
 * Requires: at least one ADMIN user in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StarterThread {
  categorySlug: string;
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
}

const STARTER_THREADS: StarterThread[] = [
  {
    categorySlug: 'ifa-divination-studies',
    title: "Odù Ògúndá Méjì: What does this Odù teach us about PATIENCE in the diaspora?",
    content: `Odù Ògúndá Méjì speaks of the warrior who must learn restraint — the blade that is tempered, not just forged.

In the diaspora, where so much of our tradition was violently disrupted, many of us are walking the path of Ògún without a clear lineage road beneath our feet. We are clearing bush that has grown thick for generations.

**The Odù counsels:**
- Progress is not always linear — the machete sometimes must be put down
- What we build slowly, we build well
- Àgbàdo kì í ní àárọ̀ — A corn cob doesn't have a morning (some things take their own time)

**Open questions for this thread:**

1. Where in your own spiritual journey have you had to choose *patience* over urgency?
2. How does Ògúndá Méjì's energy show up differently for those of us in the diaspora — without generational teachers nearby?
3. Share a time when slowing down led to a breakthrough in your understanding of Ifá.

No rank, no judgment. Whether you've been in the tradition 30 years or 30 days — your experience matters here.

*Ìmọ̀ jẹ ọrọ gbogbo ènìyàn — Knowledge belongs to everyone.*`,
    tags: ['ifa', 'odu', 'ogunda-meji', 'divination', 'diaspora'],
    isPinned: false,
  },
  {
    categorySlug: 'healing-herbs-wellness',
    title: "'What Worked For Me': A spiritual bath that shifted your energy",
    content: `One of the most powerful things about Isese tradition is the living pharmacopeia — the knowledge of plants, waters, and preparations that our Babalawos and Iyanifas have carried for generations.

This thread is a community sharing space. Tell us about **a spiritual bath, herbal preparation, or ritual cleansing** that genuinely shifted something for you — emotionally, spiritually, physically.

**Format (feel free to use loosely):**
- **What it was:** (you don't need exact names if you're not sure)
- **What you were dealing with:** (as much or as little as you want to share)
- **How you prepared it:**
- **What shifted:**

---

**Reminders for this space:**
- We're not prescribing medicine. Share experience, not diagnosis.
- Respect confidentiality — some knowledge is lineage-specific. Share what your tradition allows you to share.
- If something was prescribed by a Babalawo for you personally, be careful about generalizing it — bodies and Orí are individual.
- Ewe is sacred. Honor the plant by naming it when you can.

*Ewé ni ìwòsàn àwa — Leaves are our medicine.*

Drop your experience below. Let's build something together.`,
    tags: ['healing', 'ewe', 'spiritual-bath', 'wellness', 'herbs'],
    isPinned: false,
  },
  {
    categorySlug: 'yoruba-language-culture',
    title: "Proverb Challenge: Ọmọ tí a kò kọ́ l'ó ń kọ́ ara rẹ̀",
    content: `**The proverb:** *Ọmọ tí a kò kọ́ l'ó ń kọ́ ara rẹ̀*
**Rough translation:** A child who is not taught will teach himself (often the hard way).

---

This is a weekly Àsàyán proverb challenge. Each week we take one Yorùbá proverb and unpack it — as a community, across different perspectives and life experiences.

**This week's questions:**

1. **What does this proverb mean to you?** Give your interpretation — no wrong answers.

2. **Where have you lived this proverb?** Either as the child who had to figure it out alone, or as the elder who saw someone else navigate the hard road.

3. **How does this apply to the diaspora experience specifically?** Many of us came to Isese and Ifá without parents, grandparents, or community who carried the tradition. We were that child. What did we teach ourselves — and what did the tradition teach us once we found it?

4. **Bonus:** Do you know a related proverb in Yorùbá, Fon, or another African language?

---

*Reply in English, Yorùbá, or both. Corrections to Yorùbá are always welcome — language learning is communal here.*

Tag someone who taught you something this week.`,
    tags: ['yoruba', 'proverb', 'language', 'culture', 'diaspora'],
    isPinned: false,
  },
  {
    categorySlug: 'temple-connections-events',
    title: "Temple Spotlight: A Day at Your Ilé — Share Your Community's Story",
    content: `What is life like inside your temple, ilé, or spiritual community?

Many of us in the diaspora are searching — not just for teachers, but for *community*. We want to know what it feels like to be part of a living, breathing spiritual family.

**This thread is a Temple Spotlight series.** If you are part of a temple, ile, or community (physical or online), we'd love to hear about it.

**Share (as much as you're comfortable with):**

🏛️ **Where:** City/region (no need to share a full address — privacy first)
🌍 **Lineage or tradition:** (e.g., Isese Lagbaye, Lucumí/Santería, Candomblé, Diaspora-rooted, etc.)
📅 **When you gather:** Monthly? Weekly? Specific ceremonies?
🎉 **A day in the life:** What does a typical gathering look or feel like?
💬 **What makes your community special:** What would you want seekers to know?
🤝 **Are you welcoming new members?** (optional)

---

*If you're a seeker looking for community — browse this thread, ask questions, and reach out. Finding your ilé is one of the most profound journeys in this tradition.*

*Ẹgbẹ́ ni ìmọ̀ — Community is wisdom.*`,
    tags: ['temple', 'community', 'ile', 'events', 'connections'],
    isPinned: false,
  },
  {
    categorySlug: 'seeker-questions',
    title: "Ask Anything: New to Ifá? No judgment here — ask your first question",
    content: `Welcome.

If you have found your way to this thread, you are probably at the beginning of something. Maybe you've been drawn to Ifá for a while and haven't known where to start. Maybe you had a divination recently and have questions. Maybe someone in your family practiced and you're trying to reconnect.

**Wherever you are — you belong here.**

This thread is a judgment-free space for first questions. There are no silly questions in a tradition that has been deliberately hidden from us for generations.

**Some things seekers often ask (and this community has answers for):**

- What is Ifá? What is Isese? What is the difference?
- How do I find a trustworthy Babalawo?
- I had a divination — what does [X] mean?
- What's the difference between Ifá and Santería/Candomblé/Trinidad Orisha?
- Can non-Yoruba people practice?
- What are the first steps if I want to start?
- I'm nervous about judgment from my family — how did others navigate this?

**Ask your question below.** Community members — please respond with patience and generosity. We were all beginners once.

*Ìbẹ̀rẹ̀ ni àárọ̀ ọgbọ́n — The beginning is the morning of wisdom.*`,
    tags: ['seeker', 'beginner', 'questions', 'welcome', 'ifa-101'],
    isPinned: true,
  },
  {
    categorySlug: 'resources-recommendations',
    title: "Link Dump: What's one resource that deepened your Isese journey?",
    content: `The tradition is oral. The books are imperfect. The internet is full of both treasure and misinformation.

This thread is a curated list — built by the community, for the community — of resources that have genuinely helped people go deeper.

**Drop your recommendation below. Format:**

📖 / 🎙️ / 🎥 / 🌐 **[Title or description]**
**Why it helped:** One sentence.
**Where to find it:** (if you can share a link, please do — no affiliate links)
**Caveat (if any):** Is it Lucumí-focused? Academic? Controversial in some circles?

---

**To start us off, some community staples (add yours below!):**

- *Sixteen Cowries* by William Bascom — academic but foundational for understanding Odù structure
- *The Handbook of Yoruba Religious Concepts* by Baba Ifa Karade — accessible for diaspora seekers
- The Araba of Ile-Ife's YouTube channel — rare footage of traditional ceremony
- *Ifá Will Mend Our Broken World* by Wande Abimbola — on the philosophy, not just practice
- *Yoruba: A Complete Course for Beginners* (audio course) — for language learners

---

*Add yours. The tradition belongs to all of us — let's help each other find the good stuff.*`,
    tags: ['resources', 'books', 'learning', 'recommendations', 'links'],
    isPinned: false,
  },
  {
    categorySlug: 'culture-lifestyle',
    title: "Music Monday: Drop a track that carries Àṣẹ for you — and tell us WHY",
    content: `Every Monday, we open a space for music.

Àṣẹ moves through sound. Our tradition knows this — the bàtá drums summon Orisa. The òrìkì (praise poetry) carries power in every syllable. The voice has always been a ritual tool.

But Àṣẹ doesn't only move through "religious" music. Sometimes it's a song your grandmother hummed. Sometimes it's an Afrobeats track that stopped you in your tracks. Sometimes it's Coltrane, or Fela, or a choir from your childhood church before you found the tradition.

**This week — drop a track. Tell us:**

🎵 **Artist + Song Title**
🔥 **Why it carries Àṣẹ for you:** (this is the important part — no one-liners please)
🌍 **Any connection to the tradition or culture?** (optional — not required)

---

Music is not decoration. It is a portal.

*Orin ni ẹnu-ọ̀nà Ọrun — Song is the doorway to the divine.*

What are you listening to this week?`,
    tags: ['music', 'culture', 'lifestyle', 'ase', 'community'],
    isPinned: false,
  },
];

async function main() {
  console.log('🌿  Seeding forum starter threads...\n');

  // Author these as the platform founder's own account if it exists yet,
  // falling back to any admin, then any user at all.
  const adminUser = await prisma.user.findFirst({
    where: { email: 'ifamoyooni@outlook.com' },
    select: { id: true },
  }) ?? await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  }) ?? await prisma.user.findFirst({ select: { id: true } });

  if (!adminUser) {
    console.log('⚠️  No users found in DB — run after first admin registers');
    console.log('   Re-run this script once an admin account exists.\n');
    return;
  }

  let created = 0;
  let skipped = 0;
  let categoryMissing = 0;

  for (const thread of STARTER_THREADS) {
    const category = await prisma.forumCategory.findUnique({
      where: { slug: thread.categorySlug },
      select: { id: true, name: true },
    });

    if (!category) {
      console.log(`  ⚠️  Category not found: ${thread.categorySlug} — run seed:forum-categories first`);
      categoryMissing++;
      continue;
    }

    const existing = await prisma.forumThread.findFirst({
      where: { title: thread.title, categoryId: category.id },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⏭️  Exists:  "${thread.title.slice(0, 60)}..."`);
      skipped++;
      continue;
    }

    await prisma.forumThread.create({
      data: {
        categoryId: category.id,
        authorId: adminUser.id,
        title: thread.title,
        content: thread.content,
        status: 'ACTIVE',
        isApproved: true,
        isPinned: thread.isPinned ?? false,
        isLocked: false,
        isSacred: false,
        tags: thread.tags ?? [],
        postCount: 1,
        viewCount: 0,
        // Create the first post from the thread content
        posts: {
          create: {
            authorId: adminUser.id,
            content: thread.content,
            status: 'ACTIVE',
          },
        },
      },
    });

    console.log(`  ✅ Created: "${thread.title.slice(0, 60)}..." → ${category.name}`);
    created++;
  }

  console.log(`\n📊 Done: ${created} created, ${skipped} already existed${categoryMissing ? `, ${categoryMissing} categories missing` : ''}`);
  if (categoryMissing > 0) {
    console.log('   Run "npm run seed:forum-categories" first, then re-run this script.');
  }
  console.log('🎉 Forum starter threads seeded!\n');
}

main()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
