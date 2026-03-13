#!/usr/bin/env bash
# =============================================================================
# bootstrap-production.sh — First-deploy admin bootstrap for Ilé Àṣẹ
# =============================================================================
# Creates the first admin user from environment variables.
# Idempotent: safe to run multiple times (skips creation if user already exists).
#
# Required env vars:
#   DATABASE_URL              — Postgres connection string
#   BOOTSTRAP_ADMIN_EMAIL     — Email for the first admin account
#   BOOTSTRAP_ADMIN_PASSWORD  — Password for the first admin account (min 12 chars)
#
# Usage:
#   export DATABASE_URL="postgresql://..."
#   export BOOTSTRAP_ADMIN_EMAIL="admin@ilu-ase.com"
#   export BOOTSTRAP_ADMIN_PASSWORD="your-strong-password"
#   ./scripts/bootstrap-production.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/../backend" && pwd)"

# ── Validate required variables ──────────────────────────────────────────────

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

if [[ -z "${BOOTSTRAP_ADMIN_EMAIL:-}" ]]; then
  echo "ERROR: BOOTSTRAP_ADMIN_EMAIL is not set." >&2
  exit 1
fi

if [[ -z "${BOOTSTRAP_ADMIN_PASSWORD:-}" ]]; then
  echo "ERROR: BOOTSTRAP_ADMIN_PASSWORD is not set." >&2
  exit 1
fi

if [[ ${#BOOTSTRAP_ADMIN_PASSWORD} -lt 12 ]]; then
  echo "ERROR: BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters." >&2
  exit 1
fi

echo "=== Ilé Àṣẹ — Production Bootstrap ==="
echo "Target: ${BOOTSTRAP_ADMIN_EMAIL}"
echo "Backend: ${BACKEND_DIR}"
echo ""

# ── Run the bootstrap via a small Node.js script ─────────────────────────────

cd "${BACKEND_DIR}"

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists — skipping creation. (idempotent)');
    console.log('  Email:', email);
    console.log('  Role:', existing.role);
    await prisma.\$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Platform Administrator',
      passwordHash,
      role: 'ADMIN',
      culturalLevel: 'Awo',
      hasOnboarded: true,
      verified: true,
    },
  });

  console.log('Admin user created successfully.');
  console.log('  ID:', admin.id);
  console.log('  Email:', admin.email);
  console.log('  Role:', admin.role);
  console.log('');
  console.log('IMPORTANT: Log in at /login and change your password immediately.');

  await prisma.\$disconnect();
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
"

echo ""
echo "=== Bootstrap complete ==="
