-- Z1-803: admin follow-up (claim / outcome / note) on crisis-flagged posts.

-- CreateTable
CREATE TABLE "CrisisFollowUp" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CLAIMED',
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "note" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrisisFollowUp_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "CrisisFollowUp_status_idx" ON "CrisisFollowUp"("status");
-- CreateIndex
CREATE UNIQUE INDEX "CrisisFollowUp_source_postId_key" ON "CrisisFollowUp"("source", "postId");
-- AddForeignKey
ALTER TABLE "CrisisFollowUp" ADD CONSTRAINT "CrisisFollowUp_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CrisisFollowUp" ADD CONSTRAINT "CrisisFollowUp_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "CrisisFollowUp" ADD CONSTRAINT "CrisisFollowUp_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
