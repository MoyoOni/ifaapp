-- FOR-005: general content moderation queue for Circle feed posts, same
-- shape as ForumPost/ForumReport.

ALTER TABLE "CircleFeedPost" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'VISIBLE';

CREATE TABLE "CircleFeedReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleFeedReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CircleFeedReport_status_idx" ON "CircleFeedReport"("status");

CREATE INDEX "CircleFeedReport_postId_idx" ON "CircleFeedReport"("postId");

CREATE UNIQUE INDEX "CircleFeedReport_reporterId_postId_key" ON "CircleFeedReport"("reporterId", "postId");

ALTER TABLE "CircleFeedReport" ADD CONSTRAINT "CircleFeedReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CircleFeedReport" ADD CONSTRAINT "CircleFeedReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CircleFeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
