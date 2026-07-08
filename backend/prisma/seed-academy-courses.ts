/**
 * Academy Course Seed — real, published course content.
 *
 * Source: iluase-academy-curriculum.md / iluase-academy-prospectus.md (repo root).
 * Those documents describe a full 16-course, 4-Pillar curriculum. This seed
 * deliberately does NOT create all of it — the curriculum docs' own "Launch
 * Recommendation" section explicitly advises a phased rollout starting with
 * "One flagship course" rather than a full catalog dump, and the product
 * owner separately confirmed the same thing ("don't make the whole academy
 * about this, it's just one of many more"). This is Phase One: a single
 * course. Add the remaining 15 courses here in later phases as their own
 * reviewed additions, not all at once.
 *
 * Safe to re-run: upserted by slug — skips existing entries.
 * Run: npm run seed:academy-courses
 *
 * Requires: at least one ADMIN user in the database (course creation is
 * admin-only — see academy.service.ts's createCourse).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedLesson {
  title: string;
  content: string;
  duration: number; // minutes
}

interface SeedCourse {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  lessons: SeedLesson[];
}

const COURSES: SeedCourse[] = [
  {
    slug: 'ori-the-metaphysics-of-consciousness',
    title: 'Ori — The Metaphysics of Consciousness',
    description:
      'The opening course of Learning Pillar I: Internal Technology. An introduction to Ori — the ' +
      'Oodua framework for consciousness, destiny, and inner alignment — as a serious philosophical ' +
      'and contemplative subject, not folklore or spiritual consumption. Covers the architecture of ' +
      'Ori Inu and Ori Ode, the language of destiny (Ayanmo, Akunleyan, Ajala Mopin), Iwa as ' +
      'co-author of one\'s path, and non-ritual practices for recognizing and realigning with one\'s ' +
      'own Ori. This is conceptual education and guided reflection — it does not replace initiation, ' +
      'divination, or elder-guided sacred practice.',
    category: 'Foundational',
    level: 'BEGINNER',
    lessons: [
      {
        title: 'Ori Inu and Ori Ode',
        duration: 20,
        content:
          'Ori, in Oodua metaphysics, is understood as having two interlocking dimensions. Ori Ode is ' +
          'the physical head — visible, tangible, the seat of the senses and the body\'s presence in ' +
          'the world. Ori Inu, the Inner Head, is the deeper consciousness: the seat of destiny, ' +
          'intuition, and one\'s personal relationship with the divine. This lesson introduces Ori as a ' +
          'two-part architecture rather than a single, simple idea of "the mind," and sets up the ' +
          'distinction the rest of the course builds on: alignment is not about controlling Ori Ode, ' +
          'but about listening to and honoring Ori Inu.',
      },
      {
        title: 'Pre-Birth Destiny Contracts and Ajala Mopin',
        duration: 25,
        content:
          'Oodua thought holds that before birth, each person kneels before Ajala, the divine potter, ' +
          'and chooses — or is molded into — a particular Ori, carrying with it a destiny path agreed ' +
          'to before entering the world. This lesson explores Ajala Mopin as a symbolic account of how ' +
          'destiny is understood to be selected rather than imposed, and why this framing matters: it ' +
          'positions a person\'s path as something they participated in choosing, not merely something ' +
          'that happens to them.',
      },
      {
        title: 'Ayanmo and Akunleyan — Destiny and the Self-Chosen Path',
        duration: 20,
        content:
          'This lesson distinguishes two related terms: Ayanmo, one\'s destiny or fate in the broad ' +
          'sense, and Akunleyan, the specific path knelt for and chosen at the moment of Ori\'s ' +
          'selection. Understanding the difference matters for how a person relates to hardship and ' +
          'purpose — not as pure external fate, nor as pure self-invention, but as a chosen orientation ' +
          'that still has to be lived out, discovered, and often re-discovered over a lifetime.',
      },
      {
        title: 'Iwa as Co-Author of Destiny',
        duration: 20,
        content:
          'Destiny in this framework is not fixed and unchangeable — Iwa (character, conduct) plays an ' +
          'active role in how a chosen path actually unfolds. This lesson examines the idea that good ' +
          'or destructive character can support or derail the destiny an Ori set out with, positioning ' +
          'ethical conduct not as a separate moral add-on but as part of the same system that governs ' +
          'destiny itself.',
      },
      {
        title: 'Diagnosing Ori Desynchronization',
        duration: 25,
        content:
          'When a person\'s life feels persistently out of step with their own sense of purpose, Oodua ' +
          'thought frames this as a form of desynchronization between Ori Inu and the life actually ' +
          'being lived. This lesson looks at recognizable patterns — recurring frustration in the same ' +
          'areas, a felt sense of "going through the motions," repeated conflict between stated values ' +
          'and actual choices — as signals worth paying attention to, without pathologizing or ' +
          'over-diagnosing ordinary life difficulty.',
      },
      {
        title: 'Non-Ritual Alignment Practices',
        duration: 20,
        content:
          'This lesson introduces simple, non-ritual practices for reconnecting with Ori Inu that ' +
          'anyone can engage in without initiation: silent sitting, and contemplative practices ' +
          'involving water as a symbol of clarity and reflection. These are framed explicitly as ' +
          'conceptual and reflective tools, not as ritual or initiated practice — the course is ' +
          'consistent throughout in keeping that boundary clear.',
      },
      {
        title: 'Ego Distortion versus Healthy Ori Expression',
        duration: 20,
        content:
          'The final lesson distinguishes between the ego — the socially conditioned, defensive sense ' +
          'of self — and a healthy expression of one\'s Ori. Where ego-driven behavior tends toward ' +
          'comparison, insecurity, and reactivity, Ori-aligned behavior tends toward a settled sense of ' +
          'direction even under pressure. This closing lesson ties the course together: alignment isn\'t ' +
          'a one-time realization but an ongoing practice of noticing which of the two is actually ' +
          'driving a given choice.',
      },
    ],
  },
];

async function main() {
  console.log('📚  Seeding Academy courses (Phase One: 1 of 16 planned courses)...\n');

  const admin = await prisma.user.findFirst({
    where: { email: 'ifamoyooni@outlook.com' },
    select: { id: true },
  }) ?? await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  if (!admin) {
    console.log('⚠️  No admin user found in DB — course creation is admin-only.');
    console.log('   Re-run this script once an admin account exists.\n');
    return;
  }

  for (const course of COURSES) {
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } });
    if (existing) {
      console.log(`  ⏭️  Exists: "${course.title}"`);
      continue;
    }

    const totalDuration = course.lessons.reduce((sum, l) => sum + l.duration, 0);

    const created = await prisma.course.create({
      data: {
        instructorId: admin.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: Math.round(totalDuration / 60), // stored in hours
        price: 0,
        currency: 'NGN',
        status: 'APPROVED',
        certificateEnabled: true,
      },
    });

    for (let i = 0; i < course.lessons.length; i++) {
      const lesson = course.lessons[i];
      await prisma.lesson.create({
        data: {
          courseId: created.id,
          title: lesson.title,
          order: i + 1,
          type: 'TEXT',
          content: lesson.content,
          duration: lesson.duration,
          status: 'PUBLISHED',
        },
      });
    }

    // lessonCount is a derived cache field maintained by academy.service.ts's
    // create/update/delete-lesson paths; since we insert lessons directly via
    // Prisma here, set it explicitly to keep it consistent with the real count.
    await prisma.course.update({
      where: { id: created.id },
      data: { lessonCount: course.lessons.length },
    });

    console.log(`  ✅ Created: "${course.title}" — ${course.lessons.length} lessons`);
  }

  console.log('\n🎉 Academy course seeding complete (Phase One).\n');
}

main()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
