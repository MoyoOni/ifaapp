-- ADM/security fix: prevent a single account from repeatedly flagging the
-- same review to force it past the flaggedCount >= 2 auto-flag threshold.
-- One row per (reviewType, reviewId, flaggedBy); reviewId has no FK since it
-- points at whichever of ProductReview/BabalawoReview/CourseReview
-- reviewType selects.

CREATE TABLE "review_flags" (
    "id" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "flaggedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_flags_reviewType_reviewId_idx" ON "review_flags"("reviewType", "reviewId");

CREATE UNIQUE INDEX "review_flags_reviewType_reviewId_flaggedBy_key" ON "review_flags"("reviewType", "reviewId", "flaggedBy");

ALTER TABLE "review_flags" ADD CONSTRAINT "review_flags_flaggedBy_fkey" FOREIGN KEY ("flaggedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
