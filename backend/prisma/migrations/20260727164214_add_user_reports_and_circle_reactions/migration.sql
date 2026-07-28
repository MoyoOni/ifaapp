-- CreateTable
CREATE TABLE "CircleFeedLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleFeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleFeedComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleFeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "flaggedByKeywordRule" BOOLEAN NOT NULL DEFAULT false,
    "matchedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CircleFeedLike_postId_idx" ON "CircleFeedLike"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleFeedLike_postId_userId_key" ON "CircleFeedLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "CircleFeedComment_postId_idx" ON "CircleFeedComment"("postId");

-- CreateIndex
CREATE INDEX "UserReport_reporterId_idx" ON "UserReport"("reporterId");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_createdAt_idx" ON "UserReport"("createdAt");

-- AddForeignKey
ALTER TABLE "CircleFeedLike" ADD CONSTRAINT "CircleFeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CircleFeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFeedLike" ADD CONSTRAINT "CircleFeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFeedComment" ADD CONSTRAINT "CircleFeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CircleFeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleFeedComment" ADD CONSTRAINT "CircleFeedComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

