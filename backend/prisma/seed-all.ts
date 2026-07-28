// One command to fully restore the local/dev database's baseline content:
// users, temples, circles, forum categories + threads, academy courses, and
// moderation rules. Runs the existing individual seed scripts in the order
// they depend on each other.
//
// Usage: npm run seed:all
//
// Safe to re-run any time -- every underlying seed script only creates what's
// missing, it never deletes real data (seed-demo.ts is the one exception: it
// intentionally clears and rebuilds its own demo users/temples/circles, by
// design, so it stays a clean reproducible baseline).

import { execSync } from 'child_process';
import * as path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '..');

const STEPS = [
  'prisma/seed-demo.ts',
  'prisma/seed-ensure-admin.ts',
  'prisma/seed-forum-categories.ts',
  'prisma/seed-forum-covenant.ts',
  'prisma/seed-forum-starter-threads.ts',
  'prisma/seed-real-temples.ts',
  'prisma/seed-grief-circle.ts',
  'prisma/seed-dream-circle.ts',
  'prisma/seed-healing-circle.ts',
  'prisma/seed-cross-cultural-circle.ts',
  'prisma/seed-academy-courses.ts',
  'prisma/seed-cultural-flag-rules.ts',
];

function main() {
  // Belt-and-braces: even though nothing should ever invoke this against a
  // production database, refuse outright if it's ever tried.
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run seed:all against a production environment (NODE_ENV=production).');
    process.exit(1);
  }

  console.log('===========================================');
  console.log('  Restoring full local database content');
  console.log('===========================================\n');

  for (const step of STEPS) {
    console.log(`▶ ${step}`);
    execSync(`npx tsx ${step}`, { cwd: BACKEND_ROOT, stdio: 'inherit' });
    console.log('');
  }

  console.log('===========================================');
  console.log('✨ All seed data restored successfully!');
  console.log('===========================================');
}

main();
