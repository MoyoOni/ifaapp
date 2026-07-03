CREATE TABLE "ForumReport" (
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

    CONSTRAINT "ForumReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_reporterId_postId_key" UNIQUE ("reporterId", "postId");
CREATE INDEX "ForumReport_status_idx" ON "ForumReport"("status");
CREATE INDEX "ForumReport_postId_idx" ON "ForumReport"("postId");

ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
