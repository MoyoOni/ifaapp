#!/usr/bin/env node
/**
 * Fix package-lock.json: hoist @sentry/node's nested transitive packages to root.
 * This fixes Docker builds where @opentelemetry/* can't be found at runtime.
 */
const fs = require('fs');

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const packages = lock.packages;

const sentryNestedPrefix = 'node_modules/@sentry/node/node_modules/';
const fastifyPrefix = 'node_modules/@sentry/node/node_modules/@fastify/otel/node_modules/';
const added = [];

// Hoist packages nested inside @sentry/node/node_modules/ that are NOT at root
for (const [k, v] of Object.entries(packages)) {
  if (k.startsWith(sentryNestedPrefix) && (k.match(/node_modules/g) || []).length === 2) {
    const pkgName = k.slice(sentryNestedPrefix.length);
    const rootKey = `node_modules/${pkgName}`;
    if (!packages[rootKey]) {
      const entry = Object.fromEntries(Object.entries(v).filter(([kk]) => kk !== 'link'));
      packages[rootKey] = entry;
      added.push(pkgName);
      console.log(`  Hoisted: ${pkgName} @ ${v.version || '?'}`);
    }
  }
}

// Also fix @fastify/otel nested packages (one level deeper)
for (const [k, v] of Object.entries(packages)) {
  if (k.startsWith(fastifyPrefix)) {
    const pkgName = k.slice(fastifyPrefix.length);
    const rootKey = `node_modules/${pkgName}`;
    const sentryKey = `${sentryNestedPrefix}${pkgName}`;
    if (!packages[rootKey] && !packages[sentryKey]) {
      const entry = Object.fromEntries(Object.entries(v).filter(([kk]) => kk !== 'link'));
      packages[rootKey] = entry;
      added.push(`(fastify) ${pkgName}`);
      console.log(`  Hoisted: (fastify) ${pkgName} @ ${v.version || '?'}`);
    }
  }
}

console.log(`\nTotal packages hoisted to root: ${added.length}`);

fs.writeFileSync('package-lock.json', JSON.stringify(lock));
console.log('package-lock.json updated successfully');
