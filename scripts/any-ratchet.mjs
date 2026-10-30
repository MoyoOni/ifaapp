#!/usr/bin/env node
// `any` ratchet (October 30, 2026). `@typescript-eslint/no-explicit-any` is on
// in both packages but CI never ran lint, so explicit `any`s piled up (about
// 1,250) and hid real bugs -- typing the Flutterwave client showed the service
// calling SDK methods that do not exist. This fails CI when a package's count
// goes UP; when it goes down, lower the number in scripts/any-baseline.json.
//
// Usage: node scripts/any-ratchet.mjs <backend|frontend> [--update]
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = process.argv[2];
const update = process.argv.includes('--update');
const targets = {
  backend: { dir: 'backend', args: ['src', 'test', '--ext', '.ts'] },
  frontend: { dir: 'frontend', args: ['src', '--ext', '.ts,.tsx'] },
};
if (!targets[pkg]) {
  console.error('usage: node scripts/any-ratchet.mjs <backend|frontend> [--update]');
  process.exit(2);
}

const { dir, args } = targets[pkg];
let out;
try {
  out = execFileSync('npx', ['eslint', ...args, '-f', 'json'], { cwd: join(root, dir), maxBuffer: 256 * 1024 * 1024 }).toString();
} catch (err) {
  out = err.stdout?.toString(); // eslint exits 1 when it finds problems; we only want the JSON
  if (!out) throw err;
}
const count = JSON.parse(out).reduce(
  (n, file) => n + file.messages.filter((m) => m.ruleId === '@typescript-eslint/no-explicit-any').length,
  0
);

const baselinePath = join(root, 'scripts', 'any-baseline.json');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const allowed = baseline[pkg];

if (update || allowed === undefined) {
  baseline[pkg] = count;
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`${pkg}: baseline set to ${count} explicit any`);
} else if (count > allowed) {
  console.error(`${pkg}: ${count} explicit \`any\`, baseline is ${allowed}. Type the new code instead of using \`any\`.`);
  process.exit(1);
} else if (count < allowed) {
  console.log(`${pkg}: ${count} explicit any (baseline ${allowed}) -- lower it: node scripts/any-ratchet.mjs ${pkg} --update`);
} else {
  console.log(`${pkg}: ${count} explicit any (at baseline)`);
}
