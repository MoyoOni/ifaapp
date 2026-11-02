-- FOR-019: storytelling events reuse live sessions, with RSVPs and a link to
-- the Oral History entry the story was saved as.
ALTER TABLE "LiveSession" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'DISCUSSION';
ALTER TABLE "LiveSession" ADD COLUMN "description" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN "oralHistoryId" TEXT;
CREATE INDEX "LiveSession_kind_idx" ON "LiveSession"("kind");

CREATE TABLE "LiveSessionRsvp" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSessionRsvp_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LiveSessionRsvp_sessionId_userId_key" ON "LiveSessionRsvp"("sessionId", "userId");
CREATE INDEX "LiveSessionRsvp_userId_idx" ON "LiveSessionRsvp"("userId");
ALTER TABLE "LiveSessionRsvp" ADD CONSTRAINT "LiveSessionRsvp_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
