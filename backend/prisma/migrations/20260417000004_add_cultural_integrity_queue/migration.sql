-- ADM-018: Cultural Integrity Review Queue

-- Add review hold fields to ForumPost
ALTER TABLE "ForumPost" ADD COLUMN "heldForReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ForumPost" ADD COLUMN "reviewReason" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "ForumPost" ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "ForumPost_heldForReview_idx" ON "ForumPost"("heldForReview");

-- Content flag rules (keywords + category moderation)
CREATE TABLE "ContentFlagRule" (
  "id"        TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "reason"    TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentFlagRule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContentFlagRule" ADD CONSTRAINT "ContentFlagRule_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ContentFlagRule_type_isActive_idx" ON "ContentFlagRule"("type", "isActive");
