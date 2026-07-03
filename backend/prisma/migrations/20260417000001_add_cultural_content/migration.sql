-- ADM-015: OralHistoryEntry and SacredCalendarEvent models

CREATE TABLE IF NOT EXISTS "OralHistoryEntry" (
    "id"            TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "category"      TEXT NOT NULL,
    "babalawoName"  TEXT,
    "recordingDate" TIMESTAMP(3),
    "tags"          TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content"       TEXT NOT NULL,
    "sourceUrl"     TEXT,
    "publishedAt"   TIMESTAMP(3),
    "createdBy"     TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OralHistoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OralHistoryEntry_category_idx" ON "OralHistoryEntry"("category");
CREATE INDEX IF NOT EXISTS "OralHistoryEntry_createdAt_idx" ON "OralHistoryEntry"("createdAt");
CREATE INDEX IF NOT EXISTS "OralHistoryEntry_publishedAt_idx" ON "OralHistoryEntry"("publishedAt");

ALTER TABLE "OralHistoryEntry" ADD CONSTRAINT "OralHistoryEntry_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "SacredCalendarEvent" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "yorubaName"  TEXT,
    "description" TEXT NOT NULL,
    "date"        TIMESTAMP(3) NOT NULL,
    "endDate"     TIMESTAMP(3),
    "type"        TEXT NOT NULL DEFAULT 'FESTIVAL',
    "bannerColor" TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SacredCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SacredCalendarEvent_date_idx" ON "SacredCalendarEvent"("date");
CREATE INDEX IF NOT EXISTS "SacredCalendarEvent_isActive_idx" ON "SacredCalendarEvent"("isActive");

ALTER TABLE "SacredCalendarEvent" ADD CONSTRAINT "SacredCalendarEvent_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
