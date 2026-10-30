-- FOR-001: record which ContentFlagRule a post matched, and its review.
ALTER TABLE "ForumPost" ADD COLUMN "flagMatch" TEXT,
ADD COLUMN "flagReviewedBy" TEXT,
ADD COLUMN "flagReviewedAt" TIMESTAMP(3);

ALTER TABLE "CircleFeedPost" ADD COLUMN "flagMatch" TEXT,
ADD COLUMN "flagReviewedBy" TEXT,
ADD COLUMN "flagReviewedAt" TIMESTAMP(3);
