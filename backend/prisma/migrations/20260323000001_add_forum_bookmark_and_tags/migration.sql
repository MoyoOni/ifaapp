-- Add tags array to ForumThread
ALTER TABLE "ForumThread" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Create ForumBookmark table
CREATE TABLE "ForumBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumBookmark_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
ALTER TABLE "ForumBookmark" ADD CONSTRAINT "ForumBookmark_userId_threadId_key" UNIQUE ("userId", "threadId");

-- Indexes
CREATE INDEX "ForumBookmark_userId_idx" ON "ForumBookmark"("userId");
CREATE INDEX "ForumBookmark_threadId_idx" ON "ForumBookmark"("threadId");

-- Foreign keys
ALTER TABLE "ForumBookmark" ADD CONSTRAINT "ForumBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumBookmark" ADD CONSTRAINT "ForumBookmark_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
