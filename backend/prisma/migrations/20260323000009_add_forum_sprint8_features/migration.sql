-- F9-801: First responder + post tag fields
ALTER TABLE "ForumPost"
ADD COLUMN "isFirstResponder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "postTag" TEXT;

-- F9-802: Participation streak fields
ALTER TABLE "users"
ADD COLUMN "contributionStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastContributionDate" TIMESTAMP(3),
ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- F9-803: Elder reactions
CREATE TABLE "ElderReaction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElderReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ElderReaction_postId_userId_key" ON "ElderReaction"("postId", "userId");
CREATE INDEX "ElderReaction_postId_idx" ON "ElderReaction"("postId");
CREATE INDEX "ElderReaction_userId_idx" ON "ElderReaction"("userId");

ALTER TABLE "ElderReaction" ADD CONSTRAINT "ElderReaction_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElderReaction" ADD CONSTRAINT "ElderReaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- F9-806: Live sessions
CREATE TABLE "LiveSession" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "hostIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "platform" TEXT NOT NULL,
  "externalUrl" TEXT NOT NULL,
  "preThreadId" TEXT,
  "recordingUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");
CREATE INDEX "LiveSession_scheduledAt_idx" ON "LiveSession"("scheduledAt");
