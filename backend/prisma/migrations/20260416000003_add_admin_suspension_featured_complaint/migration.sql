-- ADM-003: Suspension & Ban fields on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "warnedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "warnCount" INTEGER NOT NULL DEFAULT 0;

-- ADM-007: Featured Practitioner fields on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "featuredExpiry" TIMESTAMP(3);

-- ADM-005: Announcement model
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Announcement_status_idx" ON "Announcement"("status");
CREATE INDEX IF NOT EXISTS "Announcement_type_idx" ON "Announcement"("type");
CREATE INDEX IF NOT EXISTS "Announcement_createdBy_idx" ON "Announcement"("createdBy");
CREATE INDEX IF NOT EXISTS "Announcement_scheduledAt_idx" ON "Announcement"("scheduledAt");

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ADM-008: PractitionerComplaint model
CREATE TABLE IF NOT EXISTS "PractitionerComplaint" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PractitionerComplaint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PractitionerComplaint_clientId_idx" ON "PractitionerComplaint"("clientId");
CREATE INDEX IF NOT EXISTS "PractitionerComplaint_practitionerId_idx" ON "PractitionerComplaint"("practitionerId");
CREATE INDEX IF NOT EXISTS "PractitionerComplaint_status_idx" ON "PractitionerComplaint"("status");
CREATE INDEX IF NOT EXISTS "PractitionerComplaint_createdAt_idx" ON "PractitionerComplaint"("createdAt");

ALTER TABLE "PractitionerComplaint" ADD CONSTRAINT "PractitionerComplaint_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PractitionerComplaint" ADD CONSTRAINT "PractitionerComplaint_practitionerId_fkey"
    FOREIGN KEY ("practitionerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PractitionerComplaint" ADD CONSTRAINT "PractitionerComplaint_resolvedById_fkey"
    FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
