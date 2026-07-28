-- CreateTable
CREATE TABLE "CommunityMentorship" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityMentorship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityMentorship_mentorId_idx" ON "CommunityMentorship"("mentorId");

-- CreateIndex
CREATE INDEX "CommunityMentorship_menteeId_idx" ON "CommunityMentorship"("menteeId");

-- CreateIndex
CREATE INDEX "CommunityMentorship_status_idx" ON "CommunityMentorship"("status");

-- CreateIndex
CREATE INDEX "ForumThread_seriesName_idx" ON "ForumThread"("seriesName");

-- AddForeignKey
ALTER TABLE "CommunityMentorship" ADD CONSTRAINT "CommunityMentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityMentorship" ADD CONSTRAINT "CommunityMentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
