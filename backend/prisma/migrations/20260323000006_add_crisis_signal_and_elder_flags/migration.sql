-- F9-602: Add hasCrisisSignal field to ForumPost for crisis detection feature
ALTER TABLE "ForumPost" ADD COLUMN "hasCrisisSignal" BOOLEAN NOT NULL DEFAULT false;

-- F9-604: Add ElderFlag table for Elder Quiet Flag (Cultural Veto) feature
CREATE TABLE "ElderFlag" (
    "id"         TEXT NOT NULL,
    "postId"     TEXT NOT NULL,
    "flaggedBy"  TEXT NOT NULL,
    "reason"     TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElderFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ElderFlag_postId_idx"    ON "ElderFlag"("postId");
CREATE INDEX "ElderFlag_status_idx"    ON "ElderFlag"("status");
CREATE INDEX "ElderFlag_flaggedBy_idx" ON "ElderFlag"("flaggedBy");

ALTER TABLE "ElderFlag" ADD CONSTRAINT "ElderFlag_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElderFlag" ADD CONSTRAINT "ElderFlag_flaggedBy_fkey"
    FOREIGN KEY ("flaggedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElderFlag" ADD CONSTRAINT "ElderFlag_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
